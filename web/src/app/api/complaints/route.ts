import { NextRequest, NextResponse } from 'next/server';
import { ApiError, errorResponse, getApiProfile } from '@/lib/api-auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { classifyComplaint } from '@/lib/ai/classify';
import { resolveAssignee } from '@/lib/engines/assignment';
import { computeSlaWindow } from '@/lib/engines/sla';
import { addAudit, addHistory, notify } from '@/lib/engines/events';
import { AUDIT_ACTIONS, STATUS } from '@/lib/constants';

// GET /api/complaints — list complaints visible to the caller (RLS-scoped).
export async function GET() {
  try {
    await getApiProfile();
    const supabase = createClient();
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new ApiError(500, error.message);
    return NextResponse.json({ complaints: data ?? [] });
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/complaints — create + run the deterministic processing flow
// (system_design §4). AI is optional; failure never blocks creation.
export async function POST(req: NextRequest) {
  try {
    const profile = await getApiProfile();
    const body = await req.json();

    const title = String(body.title ?? '').trim();
    const description = String(body.description ?? '').trim();
    const location = String(body.location ?? '').trim();
    const imagePath =
      typeof body.image_path === 'string' && body.image_path
        ? body.image_path
        : null;
    // Complainant may pick their department; default to their profile dept.
    const departmentId =
      (typeof body.department_id === 'string' && body.department_id) ||
      profile.department_id ||
      null;

    // Validation (PRD §4): meaningful description required.
    if (!title) throw new ApiError(422, 'Title is required');
    if (description.length < 10)
      throw new ApiError(422, 'Description must be at least 10 characters');
    if (!location) throw new ApiError(422, 'Location is required');

    // Use service role for the deterministic pipeline so assignment,
    // notifications and audit always succeed regardless of RLS.
    const admin = createAdminClient();

    // 1) Store complaint (SUBMITTED).
    const { data: created, error: insertErr } = await admin
      .from('complaints')
      .insert({
        created_by: profile.id,
        department_id: departmentId,
        title,
        description,
        location,
        image_path: imagePath,
        status: STATUS.SUBMITTED,
      })
      .select('*')
      .single();
    if (insertErr || !created) {
      throw new ApiError(500, insertErr?.message ?? 'Failed to create complaint');
    }

    await addHistory(admin, {
      complaintId: created.id,
      actorId: profile.id,
      action: AUDIT_ACTIONS.COMPLAINT_CREATED,
      toStatus: STATUS.SUBMITTED,
      note: 'Complaint submitted',
    });
    await addAudit(admin, {
      complaintId: created.id,
      actorId: profile.id,
      action: AUDIT_ACTIONS.COMPLAINT_CREATED,
      metadata: { code: created.code },
    });

    // 2) Classify (rule-first, AI fallback). Never throws.
    const classification = await classifyComplaint(
      `${title}. ${description}. Location: ${location}`,
    );

    // 3) Resolve assignee from the DB mapping.
    const assignee = await resolveAssignee(
      admin,
      classification.category,
      departmentId,
    );

    // 4) Compute SLA window for the suggested priority.
    const sla = await computeSlaWindow(admin, classification.priority);

    // 5) Persist classification + assignment + SLA.
    const nextStatus = assignee ? STATUS.ASSIGNED : STATUS.CLASSIFIED;
    const { data: updated } = await admin
      .from('complaints')
      .update({
        category: classification.category,
        priority: classification.priority,
        classification_source: classification.source,
        ai_confidence: classification.confidence,
        ai_summary: classification.summary,
        assigned_to: assignee,
        sla_start_at: assignee ? sla.start : null,
        sla_deadline_at: assignee ? sla.deadline : null,
        status: nextStatus,
      })
      .eq('id', created.id)
      .select('*')
      .single();

    await addHistory(admin, {
      complaintId: created.id,
      actorId: null,
      action: AUDIT_ACTIONS.CLASSIFIED,
      fromStatus: STATUS.SUBMITTED,
      toStatus: STATUS.CLASSIFIED,
      note: `Category ${classification.category} / ${classification.priority} (${classification.source}${classification.model ? ' · ' + classification.model : ''})`,
    });
    await addAudit(admin, {
      complaintId: created.id,
      actorId: null,
      action: AUDIT_ACTIONS.CLASSIFIED,
      metadata: {
        category: classification.category,
        priority: classification.priority,
        source: classification.source,
        model: classification.model ?? null,
        confidence: classification.confidence,
      },
    });

    // 6) Assignment side-effects.
    if (assignee) {
      await addHistory(admin, {
        complaintId: created.id,
        actorId: null,
        action: AUDIT_ACTIONS.ASSIGNED,
        fromStatus: STATUS.CLASSIFIED,
        toStatus: STATUS.ASSIGNED,
        note: 'Auto-assigned to responsible staff',
      });
      await addAudit(admin, {
        complaintId: created.id,
        actorId: null,
        action: AUDIT_ACTIONS.ASSIGNED,
        metadata: { assignee },
      });
      await notify(admin, {
        userId: assignee,
        complaintId: created.id,
        title: `New complaint assigned: ${created.code}`,
        body: `${title} — ${location}`,
      });
    }

    // Notify the complainant of successful submission.
    await notify(admin, {
      userId: profile.id,
      complaintId: created.id,
      title: `Complaint ${created.code} submitted`,
      body: assignee
        ? 'Your complaint was classified and assigned.'
        : 'Your complaint was classified and is awaiting assignment.',
    });

    return NextResponse.json({ complaint: updated ?? created }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

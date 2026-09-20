import { NextRequest, NextResponse } from 'next/server';
import { ApiError, errorResponse, requireApiUser } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { classifyComplaint } from '@/lib/ai/classify';
import { resolveAssignee } from '@/lib/engines/assignment';
import { computeSlaWindow } from '@/lib/engines/sla';
import { addAudit, addHistory, notify } from '@/lib/engines/events';
import { AUDIT_ACTIONS, ROLES, STATUS } from '@/lib/constants';

// GET /api/complaints — list complaints visible to the caller (role-scoped).
export async function GET() {
  try {
    const user = await requireApiUser();
    let query = db().from('complaints').select('*').order('created_at', { ascending: false });

    if (user.role === ROLES.STUDENT || user.role === ROLES.FACULTY) {
      query = query.eq('created_by', user.sub);
    } else if (user.role === ROLES.TECHNICIAN) {
      query = query.eq('assigned_to', user.sub);
    } else if (user.role === ROLES.HOD) {
      query = query.eq('department_id', user.department_id ?? '');
    }
    // PRINCIPAL / SUPER_ADMIN: all.

    const { data, error } = await query;
    if (error) throw new ApiError(500, error.message);
    return NextResponse.json({ complaints: data ?? [] });
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/complaints — create + run the deterministic processing flow.
export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser();
    const body = await req.json();

    const title = String(body.title ?? '').trim();
    const description = String(body.description ?? '').trim();
    const location = String(body.location ?? '').trim();
    const imagePath = typeof body.image_path === 'string' && body.image_path ? body.image_path : null;
    const departmentId =
      (typeof body.department_id === 'string' && body.department_id) || user.department_id || null;

    if (!title) throw new ApiError(422, 'Title is required');
    if (description.length < 10) throw new ApiError(422, 'Description must be at least 10 characters');
    if (!location) throw new ApiError(422, 'Location is required');

    const supabase = db();

    const { data: created, error: insertErr } = await supabase
      .from('complaints')
      .insert({
        created_by: user.sub,
        department_id: departmentId,
        title,
        description,
        location,
        image_path: imagePath,
        status: STATUS.SUBMITTED,
      })
      .select('*')
      .single();
    if (insertErr || !created) throw new ApiError(500, insertErr?.message ?? 'Failed to create complaint');

    await addHistory(supabase, {
      complaintId: created.id,
      actorId: user.sub,
      action: AUDIT_ACTIONS.COMPLAINT_CREATED,
      toStatus: STATUS.SUBMITTED,
      note: 'Complaint submitted',
    });
    await addAudit(supabase, {
      complaintId: created.id,
      actorId: user.sub,
      action: AUDIT_ACTIONS.COMPLAINT_CREATED,
      metadata: { code: created.code },
    });

    const classification = await classifyComplaint(`${title}. ${description}. Location: ${location}`);
    const assignee = await resolveAssignee(supabase, classification.category, departmentId);
    const sla = await computeSlaWindow(supabase, classification.priority);
    const nextStatus = assignee ? STATUS.ASSIGNED : STATUS.CLASSIFIED;

    const { data: updated } = await supabase
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

    await addHistory(supabase, {
      complaintId: created.id,
      actorId: null,
      action: AUDIT_ACTIONS.CLASSIFIED,
      fromStatus: STATUS.SUBMITTED,
      toStatus: STATUS.CLASSIFIED,
      note: `Category ${classification.category} / ${classification.priority} (${classification.source}${classification.model ? ' · ' + classification.model : ''})`,
    });
    await addAudit(supabase, {
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

    if (assignee) {
      await addHistory(supabase, {
        complaintId: created.id,
        actorId: null,
        action: AUDIT_ACTIONS.ASSIGNED,
        fromStatus: STATUS.CLASSIFIED,
        toStatus: STATUS.ASSIGNED,
        note: 'Auto-assigned to responsible worker',
      });
      await addAudit(supabase, {
        complaintId: created.id,
        actorId: null,
        action: AUDIT_ACTIONS.ASSIGNED,
        metadata: { assignee },
      });
      await notify(supabase, {
        userId: assignee,
        complaintId: created.id,
        title: `New complaint assigned: ${created.code}`,
        body: `${title} — ${location}`,
      });
    }

    await notify(supabase, {
      userId: user.sub,
      complaintId: created.id,
      title: `Complaint ${created.code} submitted`,
      body: assignee
        ? 'Your complaint was classified and assigned to a worker.'
        : 'Your complaint was classified and is awaiting assignment.',
    });

    return NextResponse.json({ complaint: updated ?? created }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

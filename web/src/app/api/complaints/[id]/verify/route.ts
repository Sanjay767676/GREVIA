import { NextRequest, NextResponse } from 'next/server';
import { ApiError, errorResponse, getApiProfile } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { addAudit, addHistory, notify } from '@/lib/engines/events';
import { AUDIT_ACTIONS, STATUS } from '@/lib/constants';
import type { Complaint } from '@/lib/types';

// POST /api/complaints/:id/verify — complainant confirms or reopens (PRD §8).
// body: { decision: 'YES' | 'NO', note?: string }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const profile = await getApiProfile();
    const body = await req.json();
    const decision = String(body.decision ?? '').toUpperCase();

    const admin = createAdminClient();
    const { data: complaint } = await admin
      .from('complaints')
      .select('*')
      .eq('id', params.id)
      .single<Complaint>();
    if (!complaint) throw new ApiError(404, 'Complaint not found');

    // Only the original complainant may verify.
    if (complaint.created_by !== profile.id) {
      throw new ApiError(403, 'Only the complainant can verify this complaint');
    }
    if (complaint.status !== STATUS.USER_VERIFICATION) {
      throw new ApiError(409, 'Complaint is not awaiting verification');
    }

    if (decision === 'YES') {
      const { data: updated, error } = await admin
        .from('complaints')
        .update({ status: STATUS.CLOSED, closed_at: new Date().toISOString() })
        .eq('id', complaint.id)
        .select('*')
        .single();
      if (error) throw new ApiError(500, error.message);

      await addHistory(admin, {
        complaintId: complaint.id,
        actorId: profile.id,
        action: AUDIT_ACTIONS.CLOSED,
        fromStatus: STATUS.USER_VERIFICATION,
        toStatus: STATUS.CLOSED,
        note: 'Complainant confirmed resolution',
      });
      await addAudit(admin, {
        complaintId: complaint.id,
        actorId: profile.id,
        action: AUDIT_ACTIONS.CLOSED,
      });
      if (complaint.assigned_to) {
        await notify(admin, {
          userId: complaint.assigned_to,
          complaintId: complaint.id,
          title: `Complaint ${complaint.code} closed`,
          body: 'The complainant confirmed the resolution.',
        });
      }
      return NextResponse.json({ complaint: updated });
    }

    if (decision === 'NO') {
      // Reopen — retain full history (PRD §8). Reset SLA for the assignee.
      const { data: updated, error } = await admin
        .from('complaints')
        .update({
          status: STATUS.REOPENED,
          resolved_at: null,
        })
        .eq('id', complaint.id)
        .select('*')
        .single();
      if (error) throw new ApiError(500, error.message);

      await addHistory(admin, {
        complaintId: complaint.id,
        actorId: profile.id,
        action: AUDIT_ACTIONS.REOPENED,
        fromStatus: STATUS.USER_VERIFICATION,
        toStatus: STATUS.REOPENED,
        note: String(body.note ?? '').trim() || 'Complainant reopened complaint',
      });
      await addAudit(admin, {
        complaintId: complaint.id,
        actorId: profile.id,
        action: AUDIT_ACTIONS.REOPENED,
      });
      if (complaint.assigned_to) {
        await notify(admin, {
          userId: complaint.assigned_to,
          complaintId: complaint.id,
          title: `Complaint ${complaint.code} reopened`,
          body: 'The complainant was not satisfied. Please review again.',
        });
      }
      return NextResponse.json({ complaint: updated });
    }

    throw new ApiError(422, "decision must be 'YES' or 'NO'");
  } catch (err) {
    return errorResponse(err);
  }
}

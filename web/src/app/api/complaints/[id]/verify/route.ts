import { NextRequest, NextResponse } from 'next/server';
import { ApiError, errorResponse, requireApiUser } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { addAudit, addHistory, notify } from '@/lib/engines/events';
import { computeSlaWindow } from '@/lib/engines/sla';
import { AUDIT_ACTIONS, STATUS } from '@/lib/constants';
import type { Complaint } from '@/lib/types';

// POST /api/complaints/:id/verify — complainant confirms (YES) or reopens (NO).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireApiUser();
    const body = await req.json();
    const decision = String(body.decision ?? '').toUpperCase();

    const supabase = db();
    const { data: complaint } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', params.id)
      .single<Complaint>();
    if (!complaint) throw new ApiError(404, 'Complaint not found');
    if (complaint.created_by !== user.sub) throw new ApiError(403, 'Only the complainant can verify');
    if (complaint.status !== STATUS.RESOLVED)
      throw new ApiError(409, 'Complaint is not awaiting verification');

    if (decision === 'YES') {
      const { data: updated, error } = await supabase
        .from('complaints')
        .update({ status: STATUS.CLOSED, closed_at: new Date().toISOString() })
        .eq('id', complaint.id)
        .select('*')
        .single();
      if (error) throw new ApiError(500, error.message);
      await addHistory(supabase, {
        complaintId: complaint.id,
        actorId: user.sub,
        action: AUDIT_ACTIONS.CLOSED,
        fromStatus: STATUS.RESOLVED,
        toStatus: STATUS.CLOSED,
        note: 'Complainant confirmed resolution',
      });
      await addAudit(supabase, { complaintId: complaint.id, actorId: user.sub, action: AUDIT_ACTIONS.CLOSED });
      if (complaint.assigned_to)
        await notify(supabase, {
          userId: complaint.assigned_to,
          complaintId: complaint.id,
          title: `Complaint ${complaint.code} closed`,
          body: 'The complainant confirmed the resolution.',
        });
      return NextResponse.json({ complaint: updated });
    }

    if (decision === 'NO') {
      // Reopen: send it back to the assigned worker AND restart its SLA window,
      // otherwise the next cron sweep would instantly re-escalate it.
      const sla = await computeSlaWindow(supabase, complaint.priority ?? 'MEDIUM', 'worker');
      const { data: updated, error } = await supabase
        .from('complaints')
        .update({
          status: STATUS.REOPENED,
          resolved_at: null,
          sla_start_at: sla.start,
          sla_deadline_at: sla.deadline,
        })
        .eq('id', complaint.id)
        .select('*')
        .single();
      if (error) throw new ApiError(500, error.message);
      await addHistory(supabase, {
        complaintId: complaint.id,
        actorId: user.sub,
        action: AUDIT_ACTIONS.REOPENED,
        fromStatus: STATUS.RESOLVED,
        toStatus: STATUS.REOPENED,
        note: String(body.note ?? '').trim() || 'Complainant reopened complaint',
      });
      await addAudit(supabase, { complaintId: complaint.id, actorId: user.sub, action: AUDIT_ACTIONS.REOPENED });
      if (complaint.assigned_to)
        await notify(supabase, {
          userId: complaint.assigned_to,
          complaintId: complaint.id,
          title: `Complaint ${complaint.code} reopened`,
          body: 'The complainant was not satisfied. Please review again.',
        });
      return NextResponse.json({ complaint: updated });
    }

    throw new ApiError(422, "decision must be 'YES' or 'NO'");
  } catch (err) {
    return errorResponse(err);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { ApiError, errorResponse, requireApiUser, requireApiRole } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { addAudit, addHistory, notify } from '@/lib/engines/events';
import { computeSlaWindow } from '@/lib/engines/sla';
import { AUDIT_ACTIONS, ROLES } from '@/lib/constants';
import type { Complaint } from '@/lib/types';

// POST /api/complaints/:id/reassign — HOD/principal reassigns a worker.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireApiUser();
    requireApiRole(user, [ROLES.HOD, ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);
    const body = await req.json();
    const staffId = String(body.staff_id ?? '');
    if (!staffId) throw new ApiError(422, 'staff_id is required');

    const supabase = db();
    const { data: complaint } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', params.id)
      .single<Complaint>();
    if (!complaint) throw new ApiError(404, 'Complaint not found');
    if (user.role === ROLES.HOD && complaint.department_id !== user.department_id)
      throw new ApiError(403, 'HOD can only reassign own department complaints');

    const sla = await computeSlaWindow(supabase, complaint.priority ?? 'MEDIUM', 'worker');
    const { data: updated, error } = await supabase
      .from('complaints')
      .update({ assigned_to: staffId, sla_start_at: sla.start, sla_deadline_at: sla.deadline })
      .eq('id', complaint.id)
      .select('*')
      .single();
    if (error) throw new ApiError(500, error.message);

    await addHistory(supabase, {
      complaintId: complaint.id,
      actorId: user.sub,
      action: AUDIT_ACTIONS.REASSIGNED,
      note: `Reassigned to worker ${staffId}`,
    });
    await addAudit(supabase, {
      complaintId: complaint.id,
      actorId: user.sub,
      action: AUDIT_ACTIONS.REASSIGNED,
      metadata: { from: complaint.assigned_to, to: staffId },
    });
    await notify(supabase, {
      userId: staffId,
      complaintId: complaint.id,
      title: `Complaint assigned to you: ${complaint.code}`,
      body: complaint.title,
    });
    return NextResponse.json({ complaint: updated });
  } catch (err) {
    return errorResponse(err);
  }
}

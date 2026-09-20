import { NextRequest, NextResponse } from 'next/server';
import { ApiError, errorResponse, getApiProfile, requireApiRole } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { addAudit, addHistory, notify } from '@/lib/engines/events';
import { computeSlaWindow } from '@/lib/engines/sla';
import { AUDIT_ACTIONS, ROLES } from '@/lib/constants';
import type { Complaint } from '@/lib/types';

// POST /api/complaints/:id/reassign — HOD/principal/admin reassigns staff.
// body: { staff_id: string }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const profile = await getApiProfile();
    requireApiRole(profile, [ROLES.HOD, ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);

    const body = await req.json();
    const staffId = String(body.staff_id ?? '');
    if (!staffId) throw new ApiError(422, 'staff_id is required');

    const admin = createAdminClient();
    const { data: complaint } = await admin
      .from('complaints')
      .select('*')
      .eq('id', params.id)
      .single<Complaint>();
    if (!complaint) throw new ApiError(404, 'Complaint not found');

    // HOD may only reassign within their own department.
    if (
      profile.role === ROLES.HOD &&
      complaint.department_id !== profile.department_id
    ) {
      throw new ApiError(403, 'HOD can only reassign own department complaints');
    }

    const sla = await computeSlaWindow(admin, complaint.priority ?? 'MEDIUM');
    const { data: updated, error } = await admin
      .from('complaints')
      .update({
        assigned_to: staffId,
        sla_start_at: sla.start,
        sla_deadline_at: sla.deadline,
      })
      .eq('id', complaint.id)
      .select('*')
      .single();
    if (error) throw new ApiError(500, error.message);

    await addHistory(admin, {
      complaintId: complaint.id,
      actorId: profile.id,
      action: AUDIT_ACTIONS.REASSIGNED,
      note: `Reassigned to staff ${staffId}`,
    });
    await addAudit(admin, {
      complaintId: complaint.id,
      actorId: profile.id,
      action: AUDIT_ACTIONS.REASSIGNED,
      metadata: { from: complaint.assigned_to, to: staffId },
    });
    await notify(admin, {
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

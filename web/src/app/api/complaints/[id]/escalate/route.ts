import { NextRequest, NextResponse } from 'next/server';
import { ApiError, errorResponse, requireApiUser, requireApiRole } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { escalateComplaint } from '@/lib/engines/escalation';
import { ROLES } from '@/lib/constants';
import type { Complaint } from '@/lib/types';

// POST /api/complaints/:id/escalate — manual escalation by HOD/principal.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireApiUser();
    requireApiRole(user, [ROLES.HOD, ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);
    const body = await req.json().catch(() => ({}));
    const reason = String(body.reason ?? 'Manual escalation').trim();

    const supabase = db();
    const { data: complaint } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', params.id)
      .single<Complaint>();
    if (!complaint) throw new ApiError(404, 'Complaint not found');
    if (user.role === ROLES.HOD && complaint.department_id !== user.department_id)
      throw new ApiError(403, 'HOD can only escalate own department complaints');

    const outcome = await escalateComplaint(supabase, complaint, user.sub, reason);
    if (!outcome.escalated) throw new ApiError(409, outcome.reason ?? 'Could not escalate');
    return NextResponse.json({ outcome });
  } catch (err) {
    return errorResponse(err);
  }
}

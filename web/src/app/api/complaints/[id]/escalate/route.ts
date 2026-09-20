import { NextRequest, NextResponse } from 'next/server';
import { ApiError, errorResponse, getApiProfile, requireApiRole } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { escalateComplaint } from '@/lib/engines/escalation';
import { ROLES } from '@/lib/constants';
import type { Complaint } from '@/lib/types';

// POST /api/complaints/:id/escalate — manual escalation by HOD/principal/admin.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const profile = await getApiProfile();
    requireApiRole(profile, [ROLES.HOD, ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);

    const body = await req.json().catch(() => ({}));
    const reason = String(body.reason ?? 'Manual escalation').trim();

    const admin = createAdminClient();
    const { data: complaint } = await admin
      .from('complaints')
      .select('*')
      .eq('id', params.id)
      .single<Complaint>();
    if (!complaint) throw new ApiError(404, 'Complaint not found');

    if (
      profile.role === ROLES.HOD &&
      complaint.department_id !== profile.department_id
    ) {
      throw new ApiError(403, 'HOD can only escalate own department complaints');
    }

    const outcome = await escalateComplaint(admin, complaint, profile.id, reason);
    if (!outcome.escalated) {
      throw new ApiError(409, outcome.reason ?? 'Could not escalate');
    }
    return NextResponse.json({ outcome });
  } catch (err) {
    return errorResponse(err);
  }
}

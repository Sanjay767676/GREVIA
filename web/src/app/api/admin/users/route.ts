import { NextRequest, NextResponse } from 'next/server';
import { ApiError, errorResponse, getApiProfile, requireApiRole } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { ROLES } from '@/lib/constants';
import { addAudit } from '@/lib/engines/events';

// PATCH /api/admin/users — update a profile's role and department.
// body: { user_id, role, department_id? }  (SUPER_ADMIN only)
export async function PATCH(req: NextRequest) {
  try {
    const profile = await getApiProfile();
    requireApiRole(profile, [ROLES.SUPER_ADMIN]);

    const body = await req.json();
    const userId = String(body.user_id ?? '');
    const role = String(body.role ?? '').toUpperCase();
    const departmentId =
      typeof body.department_id === 'string' && body.department_id
        ? body.department_id
        : null;

    if (!userId) throw new ApiError(422, 'user_id is required');
    if (!(Object.values(ROLES) as string[]).includes(role)) {
      throw new ApiError(422, 'Invalid role');
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('profiles')
      .update({ role, department_id: departmentId })
      .eq('id', userId);
    if (error) throw new ApiError(500, error.message);

    await addAudit(admin, {
      complaintId: null,
      actorId: profile.id,
      action: 'USER_ROLE_UPDATED',
      metadata: { userId, role, departmentId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

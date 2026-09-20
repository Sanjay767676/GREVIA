import { NextRequest, NextResponse } from 'next/server';
import { ApiError, errorResponse, getApiProfile, requireApiRole } from '@/lib/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { CATEGORIES, ROLES } from '@/lib/constants';
import { addAudit } from '@/lib/engines/events';

// PUT /api/admin/assignments — upsert a category -> staff mapping.
// body: { category, staff_id, department_id? }  (SUPER_ADMIN only)
export async function PUT(req: NextRequest) {
  try {
    const profile = await getApiProfile();
    requireApiRole(profile, [ROLES.SUPER_ADMIN]);

    const body = await req.json();
    const category = String(body.category ?? '').toUpperCase();
    const staffId = String(body.staff_id ?? '');
    const departmentId =
      typeof body.department_id === 'string' && body.department_id
        ? body.department_id
        : null;

    if (!(Object.values(CATEGORIES) as string[]).includes(category)) {
      throw new ApiError(422, 'Invalid category');
    }
    if (!staffId) throw new ApiError(422, 'staff_id is required');

    const admin = createAdminClient();

    // Manual upsert on (category, coalesce(department_id)) — delete existing
    // matching row then insert, since the unique index uses coalesce().
    let del = admin.from('category_staff_map').delete().eq('category', category);
    del = departmentId ? del.eq('department_id', departmentId) : del.is('department_id', null);
    await del;

    const { error } = await admin.from('category_staff_map').insert({
      category,
      department_id: departmentId,
      staff_id: staffId,
    });
    if (error) throw new ApiError(500, error.message);

    await addAudit(admin, {
      complaintId: null,
      actorId: profile.id,
      action: 'ASSIGNMENT_MAP_UPDATED',
      metadata: { category, departmentId, staffId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

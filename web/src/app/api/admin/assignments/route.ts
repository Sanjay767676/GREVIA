import { NextRequest, NextResponse } from 'next/server';
import { ApiError, errorResponse, requireApiUser, requireApiRole } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { addAudit } from '@/lib/engines/events';
import { CATEGORIES, ROLES } from '@/lib/constants';

// GET /api/admin/assignments — category -> worker mappings.
export async function GET() {
  try {
    const user = await requireApiUser();
    requireApiRole(user, [ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);
    const { data, error } = await db().from('category_staff_map').select('*');
    if (error) throw new ApiError(500, error.message);
    return NextResponse.json({ mappings: data ?? [] });
  } catch (err) {
    return errorResponse(err);
  }
}

// PUT /api/admin/assignments — upsert a category -> worker mapping.
export async function PUT(req: NextRequest) {
  try {
    const actor = await requireApiUser();
    requireApiRole(actor, [ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);
    const body = await req.json();
    const category = String(body.category ?? '').toUpperCase();
    const staffId = String(body.staff_id ?? '');
    const departmentId =
      typeof body.department_id === 'string' && body.department_id ? body.department_id : null;

    if (!(Object.values(CATEGORIES) as string[]).includes(category)) throw new ApiError(422, 'Invalid category');
    if (!staffId) throw new ApiError(422, 'staff_id is required');

    const supabase = db();
    let del = supabase.from('category_staff_map').delete().eq('category', category);
    del = departmentId ? del.eq('department_id', departmentId) : del.is('department_id', null);
    await del;

    const { error } = await supabase
      .from('category_staff_map')
      .insert({ category, department_id: departmentId, staff_id: staffId });
    if (error) throw new ApiError(500, error.message);

    await addAudit(supabase, {
      complaintId: null,
      actorId: actor.sub,
      action: 'ASSIGNMENT_MAP_UPDATED',
      metadata: { category, departmentId, staffId },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

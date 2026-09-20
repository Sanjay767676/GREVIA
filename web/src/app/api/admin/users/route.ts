import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { ApiError, errorResponse, requireApiUser, requireApiRole } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { addAudit } from '@/lib/engines/events';
import { ROLES } from '@/lib/constants';

// GET /api/admin/users — list all staff/users (principal only).
export async function GET() {
  try {
    const user = await requireApiUser();
    requireApiRole(user, [ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);
    const { data, error } = await db()
      .from('app_users')
      .select('id, username, full_name, role, department_id, created_at')
      .order('role');
    if (error) throw new ApiError(500, error.message);
    return NextResponse.json({ users: data ?? [] });
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/admin/users — Principal provisions an HOD or Worker (or any role).
// body: { username, password, full_name, role, department_id? }
export async function POST(req: NextRequest) {
  try {
    const actor = await requireApiUser();
    requireApiRole(actor, [ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);
    const body = await req.json();

    const username = String(body.username ?? '').trim();
    const password = String(body.password ?? '');
    const fullName = String(body.full_name ?? '').trim();
    const role = String(body.role ?? '').toUpperCase();
    const departmentId =
      typeof body.department_id === 'string' && body.department_id ? body.department_id : null;

    if (!username) throw new ApiError(422, 'Username is required');
    if (password.length < 3) throw new ApiError(422, 'Password must be at least 3 characters');
    if (!(Object.values(ROLES) as string[]).includes(role)) throw new ApiError(422, 'Invalid role');

    const supabase = db();
    const { data: existing } = await supabase
      .from('app_users')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (existing) throw new ApiError(409, 'Username already exists');

    const password_hash = await bcrypt.hash(password, 10);
    const { data: created, error } = await supabase
      .from('app_users')
      .insert({
        username,
        password_hash,
        full_name: fullName || username,
        role,
        department_id: departmentId,
      })
      .select('id, username, full_name, role, department_id')
      .single();
    if (error) throw new ApiError(500, error.message);

    await addAudit(supabase, {
      complaintId: null,
      actorId: actor.sub,
      action: 'USER_CREATED',
      metadata: { username, role, departmentId },
    });

    return NextResponse.json({ user: created }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

// PATCH /api/admin/users — update role/department/password of an existing user.
export async function PATCH(req: NextRequest) {
  try {
    const actor = await requireApiUser();
    requireApiRole(actor, [ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);
    const body = await req.json();
    const userId = String(body.user_id ?? '');
    if (!userId) throw new ApiError(422, 'user_id is required');

    const patch: Record<string, unknown> = {};
    if (body.role) {
      const role = String(body.role).toUpperCase();
      if (!(Object.values(ROLES) as string[]).includes(role)) throw new ApiError(422, 'Invalid role');
      patch.role = role;
    }
    if (typeof body.department_id !== 'undefined') {
      patch.department_id = body.department_id || null;
    }
    if (body.password) {
      patch.password_hash = await bcrypt.hash(String(body.password), 10);
    }
    if (Object.keys(patch).length === 0) throw new ApiError(422, 'Nothing to update');

    const { error } = await db().from('app_users').update(patch).eq('id', userId);
    if (error) throw new ApiError(500, error.message);
    await addAudit(db(), {
      complaintId: null,
      actorId: actor.sub,
      action: 'USER_UPDATED',
      metadata: { userId, fields: Object.keys(patch) },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

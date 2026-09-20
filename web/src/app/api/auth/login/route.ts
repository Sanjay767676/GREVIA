import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { createSession } from '@/lib/session';
import { errorResponse, ApiError } from '@/lib/api-auth';
import { portalForRole } from '@/lib/auth';
import type { Role } from '@/lib/constants';

// POST /api/auth/login — username + password. Verifies bcrypt hash, sets session.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body.username ?? '').trim();
    const password = String(body.password ?? '');
    if (!username || !password) throw new ApiError(422, 'Username and password are required');

    const { data: user } = await db()
      .from('app_users')
      .select('id, username, password_hash, full_name, role, department_id')
      .eq('username', username)
      .maybeSingle();

    if (!user) throw new ApiError(401, 'Invalid username or password');

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new ApiError(401, 'Invalid username or password');

    await createSession({
      sub: user.id,
      username: user.username,
      role: user.role as Role,
      full_name: user.full_name,
      department_id: user.department_id,
    });

    return NextResponse.json({ ok: true, redirect: portalForRole(user.role as Role) });
  } catch (err) {
    return errorResponse(err);
  }
}

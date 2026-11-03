import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../lib/db.js';
import { ApiError, asyncHandler } from '../lib/errors.js';
import { requireAuth } from '../lib/auth.js';
import { clearSessionCookie, readSession, setSessionCookie, signSession } from '../lib/session.js';
import { ROLE_PORTAL, type Role } from '../domain/constants.js';

const router = Router();

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const username = String(req.body?.username ?? '').trim();
    const password = String(req.body?.password ?? '');
    if (!username || !password) {
      throw new ApiError(422, 'Username and password are required');
    }

    const { data: user } = await db()
      .from('app_users')
      .select('id, username, password_hash, full_name, role, department_id')
      .eq('username', username)
      .maybeSingle();

    if (!user) throw new ApiError(401, 'Invalid username or password');

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new ApiError(401, 'Invalid username or password');

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role as Role,
      full_name: user.full_name,
      department_id: user.department_id,
    };

    const token = await signSession(payload);
    setSessionCookie(res, token);

    res.json({
      user: payload,
      redirect: ROLE_PORTAL[user.role as Role] ?? '/login',
    });
  }),
);

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

// GET /api/auth/me — current session, used by the SPA on load.
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const user = await readSession(req);
    if (!user) throw new ApiError(401, 'Not authenticated');
    res.json({ user, redirect: ROLE_PORTAL[user.role] ?? '/login' });
  }),
);

export default router;

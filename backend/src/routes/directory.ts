import { Router } from 'express';
import { db } from '../lib/db.js';
import { ApiError, asyncHandler } from '../lib/errors.js';
import { requireAuth, requireRole } from '../lib/auth.js';
import { ROLES } from '../domain/constants.js';

const router = Router();

// NOTE: auth is applied per route (not router.use) because this router is
// mounted on /api. A blanket guard would also intercept unrelated routes such
// as /api/cron/sla-check, which authenticate with a shared secret instead.

// GET /api/departments — reference list for forms.
router.get(
  '/departments',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const { data, error } = await db().from('departments').select('*').order('name');
    if (error) throw new ApiError(500, error.message);
    res.json({ departments: data ?? [] });
  }),
);

// GET /api/staff — workers the caller may assign to.
// HOD is scoped to their own department; principal sees everyone.
router.get(
  '/staff',
  requireAuth,
  requireRole(ROLES.HOD, ROLES.PRINCIPAL, ROLES.SUPER_ADMIN),
  asyncHandler(async (_req, res) => {
    const { data, error } = await db()
      .from('app_users')
      .select('id, username, full_name, role, department_id')
      .eq('role', ROLES.TECHNICIAN)
      .order('full_name');

    if (error) throw new ApiError(500, error.message);
    res.json({ staff: data ?? [] });
  }),
);

export default router;

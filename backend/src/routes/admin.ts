import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../lib/db.js';
import { ApiError, asyncHandler } from '../lib/errors.js';
import { requireAuth, requireRole, user } from '../lib/auth.js';
import { addAudit } from '../services/events.js';
import { runSlaSweep } from '../services/sla-sweep.js';
import { CATEGORIES, PRIORITY, ROLES, type Role } from '../domain/constants.js';

const router = Router();

router.use(requireAuth, requireRole(ROLES.PRINCIPAL, ROLES.SUPER_ADMIN));

// GET /api/admin/users — list all users.
router.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const { data, error } = await db()
      .from('app_users')
      .select('id, username, full_name, role, department_id, created_at')
      .order('role');
    if (error) throw new ApiError(500, error.message);
    res.json({ users: data ?? [] });
  }),
);

// POST /api/admin/users — provision a user.
router.post(
  '/users',
  asyncHandler(async (req, res) => {
    const actor = user(req);
    const body = req.body ?? {};

    const username = String(body.username ?? '').trim();
    const password = String(body.password ?? '');
    const fullName = String(body.full_name ?? '').trim();
    const role = String(body.role ?? '').toUpperCase();
    const departmentId =
      typeof body.department_id === 'string' && body.department_id ? body.department_id : null;

    if (!username) throw new ApiError(422, 'Username is required');
    if (password.length < 3) throw new ApiError(422, 'Password must be at least 3 characters');
    if (!(Object.values(ROLES) as string[]).includes(role)) {
      throw new ApiError(422, 'Invalid role');
    }

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

    res.status(201).json({ user: created });
  }),
);

// PATCH /api/admin/users — update role, department or password.
router.patch(
  '/users',
  asyncHandler(async (req, res) => {
    const actor = user(req);
    const body = req.body ?? {};
    const userId = String(body.user_id ?? '');
    if (!userId) throw new ApiError(422, 'user_id is required');

    const patch: Record<string, unknown> = {};
    if (body.role) {
      const role = String(body.role).toUpperCase();
      if (!(Object.values(ROLES) as string[]).includes(role)) {
        throw new ApiError(422, 'Invalid role');
      }
      patch.role = role as Role;
    }
    if (typeof body.department_id !== 'undefined') {
      patch.department_id = body.department_id || null;
    }
    if (body.password) {
      patch.password_hash = await bcrypt.hash(String(body.password), 10);
    }
    if (Object.keys(patch).length === 0) throw new ApiError(422, 'Nothing to update');

    const supabase = db();
    const { error } = await supabase.from('app_users').update(patch).eq('id', userId);
    if (error) throw new ApiError(500, error.message);

    await addAudit(supabase, {
      complaintId: null,
      actorId: actor.sub,
      action: 'USER_UPDATED',
      metadata: { userId, fields: Object.keys(patch) },
    });

    res.json({ ok: true });
  }),
);

// GET /api/admin/sla — worker + HOD windows per priority.
router.get(
  '/sla',
  asyncHandler(async (_req, res) => {
    const { data, error } = await db().from('sla_config').select('*').order('priority');
    if (error) throw new ApiError(500, error.message);
    res.json({ sla: data ?? [] });
  }),
);

// PATCH /api/admin/sla — set escalation timers.
router.patch(
  '/sla',
  asyncHandler(async (req, res) => {
    const actor = user(req);
    const updates = Array.isArray(req.body?.updates) ? req.body.updates : [];
    const supabase = db();

    for (const u of updates as Record<string, unknown>[]) {
      const priority = String(u.priority ?? '').toUpperCase();
      const worker = Number(u.worker_minutes);
      const hod = Number(u.hod_minutes);
      if (!(Object.values(PRIORITY) as string[]).includes(priority)) continue;
      if (!Number.isFinite(worker) || worker <= 0) continue;
      if (!Number.isFinite(hod) || hod <= 0) continue;
      await supabase
        .from('sla_config')
        .upsert(
          { priority, worker_minutes: worker, hod_minutes: hod },
          { onConflict: 'priority' },
        );
    }

    await addAudit(supabase, {
      complaintId: null,
      actorId: actor.sub,
      action: 'SLA_CONFIG_UPDATED',
      metadata: { updates },
    });

    res.json({ ok: true });
  }),
);

// GET /api/admin/assignments — category -> worker mappings.
router.get(
  '/assignments',
  asyncHandler(async (_req, res) => {
    const { data, error } = await db().from('category_staff_map').select('*');
    if (error) throw new ApiError(500, error.message);
    res.json({ mappings: data ?? [] });
  }),
);

// PUT /api/admin/assignments — upsert a category -> worker mapping.
router.put(
  '/assignments',
  asyncHandler(async (req, res) => {
    const actor = user(req);
    const body = req.body ?? {};

    const category = String(body.category ?? '').toUpperCase();
    const staffId = String(body.staff_id ?? '');
    const departmentId =
      typeof body.department_id === 'string' && body.department_id ? body.department_id : null;

    if (!(Object.values(CATEGORIES) as string[]).includes(category)) {
      throw new ApiError(422, 'Invalid category');
    }
    if (!staffId) throw new ApiError(422, 'staff_id is required');

    const supabase = db();
    const { data: staffUser } = await supabase
      .from('app_users')
      .select('id, role')
      .eq('id', staffId)
      .maybeSingle();
    if (!staffUser || staffUser.role !== ROLES.TECHNICIAN) {
      throw new ApiError(422, 'staff_id must be a technician');
    }

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

    res.json({ ok: true });
  }),
);

// POST /api/admin/run-escalation — Principal-triggered SLA sweep.
router.post(
  '/run-escalation',
  asyncHandler(async (req, res) => {
    const result = await runSlaSweep(db(), user(req).sub);
    res.json(result);
  }),
);

// GET /api/admin/audit — recent audit log entries.
router.get(
  '/audit',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 200) || 200, 500);
    const { data, error } = await db()
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new ApiError(500, error.message);
    res.json({ logs: data ?? [] });
  }),
);

export default router;

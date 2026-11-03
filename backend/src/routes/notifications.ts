import { Router } from 'express';
import { db } from '../lib/db.js';
import { ApiError, asyncHandler } from '../lib/errors.js';
import { requireAuth, user } from '../lib/auth.js';

const router = Router();

router.use(requireAuth);

// GET /api/notifications — latest 50 for the caller, plus unread count.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const me = user(req);
    const { data, error } = await db()
      .from('notifications')
      .select('*')
      .eq('user_id', me.sub)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw new ApiError(500, error.message);

    const unread = (data ?? []).filter((n: { read: boolean }) => !n.read).length;
    res.json({ notifications: data ?? [], unread });
  }),
);

// PATCH /api/notifications — mark one (id in body) or all as read.
router.patch(
  '/',
  asyncHandler(async (req, res) => {
    const me = user(req);
    const id = req.body?.id;
    let query = db().from('notifications').update({ read: true }).eq('user_id', me.sub);
    if (id) query = query.eq('id', String(id));

    const { error } = await query;
    if (error) throw new ApiError(500, error.message);
    res.json({ ok: true });
  }),
);

export default router;

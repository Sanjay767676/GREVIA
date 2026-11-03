import { Router, type Request, type Response } from 'express';
import { db } from '../lib/db.js';
import { env } from '../config/env.js';
import { ApiError, asyncHandler } from '../lib/errors.js';
import { runSlaSweep } from '../services/sla-sweep.js';

const router = Router();

// GET|POST /api/cron/sla-check — protected by CRON_SECRET or a Vercel Cron
// request header. Escalates every open complaint past its SLA deadline.
async function handler(req: Request, res: Response) {
  const provided = String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  const isVercelCron = Boolean(req.headers['x-vercel-cron']);
  const secretOk = Boolean(env.cronSecret) && provided === env.cronSecret;

  if (!secretOk && !isVercelCron) {
    throw new ApiError(401, 'Unauthorized');
  }

  const result = await runSlaSweep(db(), null);
  res.json(result);
}

router.get('/sla-check', asyncHandler(handler));
router.post('/sla-check', asyncHandler(handler));

export default router;

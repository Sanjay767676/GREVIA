import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { escalateComplaint } from '@/lib/engines/escalation';
import { getServerEnv } from '@/lib/env';
import { OPEN_STATUSES, STATUS } from '@/lib/constants';
import type { Complaint } from '@/lib/types';

// GET|POST /api/cron/sla-check — background SLA sweep (system_design §9).
// Finds open complaints past their deadline and escalates them one level,
// idempotently. Protected by CRON_SECRET (Authorization: Bearer <secret>).
async function handler(req: NextRequest) {
  const env = getServerEnv();
  const auth = req.headers.get('authorization') ?? '';
  const provided = auth.replace(/^Bearer\s+/i, '');
  // Accept either our shared CRON_SECRET (manual/external schedulers) or
  // Vercel Cron's automatic invocation (identified by the x-vercel-cron header,
  // which is only present on genuine platform cron calls).
  const isVercelCron = req.headers.has('x-vercel-cron');
  const secretOk = Boolean(env.cronSecret) && provided === env.cronSecret;
  if (!secretOk && !isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  // Escalatable = open, has a deadline, deadline passed, not resolved/closed.
  const escalatable = OPEN_STATUSES.filter(
    (s) => s !== STATUS.USER_VERIFICATION,
  );

  const { data: due, error } = await admin
    .from('complaints')
    .select('*')
    .lt('sla_deadline_at', nowIso)
    .in('status', escalatable)
    .returns<Complaint[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { code: string; escalated: boolean; reason?: string }[] = [];
  for (const complaint of due ?? []) {
    const outcome = await escalateComplaint(
      admin,
      complaint,
      null,
      'SLA deadline exceeded',
    );
    results.push({
      code: complaint.code,
      escalated: outcome.escalated,
      reason: outcome.reason,
    });
  }

  return NextResponse.json({
    checked: due?.length ?? 0,
    escalated: results.filter((r) => r.escalated).length,
    results,
    at: nowIso,
  });
}

export async function GET(req: NextRequest) {
  return handler(req);
}
export async function POST(req: NextRequest) {
  return handler(req);
}

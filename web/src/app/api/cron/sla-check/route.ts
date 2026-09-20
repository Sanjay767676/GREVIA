import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { escalateComplaint } from '@/lib/engines/escalation';
import { getServerEnv } from '@/lib/env';
import { OPEN_STATUSES, STATUS } from '@/lib/constants';
import type { Complaint } from '@/lib/types';

// GET|POST /api/cron/sla-check — finds overdue complaints and escalates one
// level (worker->HOD, HOD->Principal). Protected by CRON_SECRET or Vercel Cron.
async function handler(req: NextRequest) {
  const env = getServerEnv();
  const provided = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const isVercelCron = req.headers.has('x-vercel-cron');
  const secretOk = Boolean(env.cronSecret) && provided === env.cronSecret;
  if (!secretOk && !isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = db();
  const nowIso = new Date().toISOString();
  const escalatable = OPEN_STATUSES.filter((s) => s !== STATUS.USER_VERIFICATION);

  const { data: due, error } = await supabase
    .from('complaints')
    .select('*')
    .lt('sla_deadline_at', nowIso)
    .in('status', escalatable)
    .returns<Complaint[]>();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: { code: string; escalated: boolean; reason?: string }[] = [];
  for (const complaint of due ?? []) {
    const outcome = await escalateComplaint(supabase, complaint, null, 'SLA deadline exceeded');
    results.push({ code: complaint.code, escalated: outcome.escalated, reason: outcome.reason });
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

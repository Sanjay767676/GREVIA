import { NextResponse } from 'next/server';
import { ApiError, errorResponse, requireApiUser, requireApiRole } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { escalateComplaint } from '@/lib/engines/escalation';
import { OPEN_STATUSES, ROLES, STATUS } from '@/lib/constants';
import type { Complaint } from '@/lib/types';

// POST /api/admin/run-escalation — Principal-triggered SLA sweep. Same logic as
// the cron job, but gated by the Principal session (no CRON_SECRET needed).
// Lets the escalation workflow be demonstrated on demand on Vercel's free plan
// where cron only runs once per day.
export async function POST() {
  try {
    const user = await requireApiUser();
    requireApiRole(user, [ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);

    const supabase = db();
    const nowIso = new Date().toISOString();
    const escalatable = OPEN_STATUSES.filter(
      (s) => s !== STATUS.USER_VERIFICATION && s !== STATUS.RESOLVED,
    );

    const { data: due, error } = await supabase
      .from('complaints')
      .select('*')
      .lt('sla_deadline_at', nowIso)
      .in('status', escalatable)
      .returns<Complaint[]>();
    if (error) throw new ApiError(500, error.message);

    let escalated = 0;
    for (const complaint of due ?? []) {
      const outcome = await escalateComplaint(supabase, complaint, user.sub, 'SLA deadline exceeded');
      if (outcome.escalated) escalated += 1;
    }

    return NextResponse.json({ checked: due?.length ?? 0, escalated });
  } catch (err) {
    return errorResponse(err);
  }
}

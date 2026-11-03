import type { SupabaseClient } from '@supabase/supabase-js';
import { OPEN_STATUSES, STATUS } from '../domain/constants.js';
import type { Complaint } from '../domain/types.js';
import { escalateComplaint } from './escalation.js';

export interface SweepResult {
  checked: number;
  escalated: number;
  results: { code: string; escalated: boolean; reason?: string }[];
  at: string;
}

// Find every open complaint past its SLA deadline and escalate one level.
// Shared by the Principal "run now" button and the cron endpoint.
export async function runSlaSweep(
  supabase: SupabaseClient,
  actorId: string | null,
): Promise<SweepResult> {
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

  if (error) throw new Error(error.message);

  const results: { code: string; escalated: boolean; reason?: string }[] = [];
  for (const complaint of due ?? []) {
    const outcome = await escalateComplaint(
      supabase,
      complaint,
      actorId,
      'SLA deadline exceeded',
    );
    results.push({
      code: complaint.code,
      escalated: outcome.escalated,
      reason: outcome.reason,
    });
  }

  return {
    checked: due?.length ?? 0,
    escalated: results.filter((r) => r.escalated).length,
    results,
    at: nowIso,
  };
}

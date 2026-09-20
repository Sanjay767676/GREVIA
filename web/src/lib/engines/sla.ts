// ---------------------------------------------------------------------------
// SLA engine (system_design §7, PRD §10). SLA windows are DB-driven
// (sla_config); demo mode overrides with short windows for live demos.
// ---------------------------------------------------------------------------

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  DEFAULT_SLA_MINUTES,
  DEMO_SLA_MINUTES,
  type Priority,
} from '../constants';
import { getServerEnv } from '../env';

// Resolve SLA minutes for a priority. Demo mode short-circuits DB lookup.
export async function getSlaMinutes(
  supabase: SupabaseClient,
  priority: Priority,
): Promise<number> {
  if (getServerEnv().demoMode) {
    return DEMO_SLA_MINUTES[priority];
  }
  const { data } = await supabase
    .from('sla_config')
    .select('minutes')
    .eq('priority', priority)
    .maybeSingle();

  return data?.minutes ?? DEFAULT_SLA_MINUTES[priority];
}

// Compute SLA start + deadline for a newly assigned complaint.
export async function computeSlaWindow(
  supabase: SupabaseClient,
  priority: Priority,
  startAt: Date = new Date(),
): Promise<{ start: string; deadline: string; minutes: number }> {
  const minutes = await getSlaMinutes(supabase, priority);
  const deadline = new Date(startAt.getTime() + minutes * 60_000);
  return {
    start: startAt.toISOString(),
    deadline: deadline.toISOString(),
    minutes,
  };
}

// --- Pure helpers usable client-side (no DB) -------------------------------

export function remainingMs(deadlineIso: string | null, now: Date = new Date()): number | null {
  if (!deadlineIso) return null;
  return new Date(deadlineIso).getTime() - now.getTime();
}

export function isOverdue(deadlineIso: string | null, now: Date = new Date()): boolean {
  const rem = remainingMs(deadlineIso, now);
  return rem !== null && rem < 0;
}

// "Due soon" = within 25% of the window remaining (and not yet overdue).
export function isDueSoon(
  deadlineIso: string | null,
  startIso: string | null,
  now: Date = new Date(),
): boolean {
  if (!deadlineIso || !startIso) return false;
  const total = new Date(deadlineIso).getTime() - new Date(startIso).getTime();
  const rem = new Date(deadlineIso).getTime() - now.getTime();
  if (total <= 0) return false;
  return rem > 0 && rem <= total * 0.25;
}

export function formatRemaining(deadlineIso: string | null, now: Date = new Date()): string {
  const rem = remainingMs(deadlineIso, now);
  if (rem === null) return '—';
  const overdue = rem < 0;
  const abs = Math.abs(rem);
  const h = Math.floor(abs / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  const label = h > 0 ? `${h}h ${m}m` : `${m}m`;
  return overdue ? `Overdue by ${label}` : `${label} left`;
}

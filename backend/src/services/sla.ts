import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import {
  DEFAULT_SLA_MINUTES,
  DEMO_SLA_MINUTES,
  type Priority,
} from '../domain/constants.js';

export type SlaStage = 'worker' | 'hod';

// Resolve SLA minutes for a priority + stage. Demo mode short-circuits the DB.
export async function getSlaMinutes(
  supabase: SupabaseClient,
  priority: Priority,
  stage: SlaStage = 'worker',
): Promise<number> {
  if (env.demoMode) return DEMO_SLA_MINUTES[priority];

  const { data } = await supabase
    .from('sla_config')
    .select('worker_minutes, hod_minutes')
    .eq('priority', priority)
    .maybeSingle();

  if (!data) return DEFAULT_SLA_MINUTES[priority];
  return stage === 'hod' ? data.hod_minutes : data.worker_minutes;
}

export async function computeSlaWindow(
  supabase: SupabaseClient,
  priority: Priority,
  stage: SlaStage = 'worker',
  startAt: Date = new Date(),
): Promise<{ start: string; deadline: string; minutes: number }> {
  const minutes = await getSlaMinutes(supabase, priority, stage);
  const deadline = new Date(startAt.getTime() + minutes * 60_000);
  return { start: startAt.toISOString(), deadline: deadline.toISOString(), minutes };
}

// --- Pure helpers (also mirrored in the frontend) --------------------------

export function remainingMs(deadlineIso: string | null, now: Date = new Date()): number | null {
  if (!deadlineIso) return null;
  return new Date(deadlineIso).getTime() - now.getTime();
}

export function isOverdue(deadlineIso: string | null, now: Date = new Date()): boolean {
  const rem = remainingMs(deadlineIso, now);
  return rem !== null && rem < 0;
}

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

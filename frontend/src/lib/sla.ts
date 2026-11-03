// Client-side SLA helpers. Mirrors backend/src/services/sla.ts.

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
  const days = Math.floor(abs / 86_400_000);
  const h = Math.floor((abs % 86_400_000) / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  const label = days > 0 ? `${days}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
  return overdue ? `Overdue by ${label}` : `${label} left`;
}

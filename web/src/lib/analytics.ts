import { CATEGORY_LABELS, STATUS, type Category } from './constants';
import type { Complaint } from './types';

// Category distribution (count per category label).
export function categoryDistribution(
  complaints: Complaint[],
): { label: string; count: number }[] {
  const counts = new Map<Category, number>();
  for (const c of complaints) {
    if (!c.category) continue;
    counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([cat, count]) => ({ label: CATEGORY_LABELS[cat], count }))
    .sort((a, b) => b.count - a.count);
}

// Average resolution time in hours for closed complaints.
export function avgResolutionHours(complaints: Complaint[]): number | null {
  const closed = complaints.filter(
    (c) => c.status === STATUS.CLOSED && c.resolved_at,
  );
  if (closed.length === 0) return null;
  const totalMs = closed.reduce((sum, c) => {
    const start = new Date(c.created_at).getTime();
    const end = new Date(c.resolved_at as string).getTime();
    return sum + Math.max(0, end - start);
  }, 0);
  return Number((totalMs / closed.length / 3_600_000).toFixed(1));
}

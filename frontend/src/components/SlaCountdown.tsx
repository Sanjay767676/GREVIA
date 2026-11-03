import { useEffect, useState } from 'react';
import { formatRemaining, isOverdue } from '../lib/sla';
import { Icon } from './Icon';

// Live-updating SLA remaining time. Recomputes every 30s.
export function SlaCountdown({ deadline }: { deadline: string | null }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, [deadline]);

  if (!deadline) {
    return (
      <span className="inline-flex items-center gap-1 text-stone-400">
        <Icon name="clock" className="h-3.5 w-3.5" />
        No SLA
      </span>
    );
  }

  const overdue = isOverdue(deadline);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
        overdue
          ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200'
          : 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
      }`}
    >
      <Icon name={overdue ? 'alert' : 'clock'} className="h-3 w-3" />
      {formatRemaining(deadline)}
    </span>
  );
}

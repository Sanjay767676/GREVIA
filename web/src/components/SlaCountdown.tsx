'use client';

import { useEffect, useState } from 'react';
import { formatRemaining, isOverdue } from '@/lib/engines/sla';

// Live-updating SLA remaining time. Recomputes every 30s.
export function SlaCountdown({ deadline }: { deadline: string | null }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, [deadline]);

  if (!deadline) return <span className="text-slate-400">No SLA</span>;
  const overdue = isOverdue(deadline);
  return (
    <span className={overdue ? 'font-medium text-red-600' : 'text-slate-600'}>
      {formatRemaining(deadline)}
    </span>
  );
}

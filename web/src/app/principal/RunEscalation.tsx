'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Runs the SLA escalation sweep on demand (Principal only). Useful on hosts
// where scheduled cron is limited (e.g. Vercel Hobby = once/day).
export function RunEscalation() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/run-escalation', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? 'Failed');
        return;
      }
      setMsg(`Checked ${data.checked}, escalated ${data.escalated}.`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={run} disabled={loading} className="btn-secondary">
        {loading ? 'Running…' : 'Run SLA escalation check'}
      </button>
      {msg && <span className="text-sm text-slate-500">{msg}</span>}
    </div>
  );
}

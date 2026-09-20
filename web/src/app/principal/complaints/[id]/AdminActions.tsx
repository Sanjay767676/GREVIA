'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Principal/admin oversight: escalate to the next level (e.g. higher authority).
export function AdminActions({ complaintId }: { complaintId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function escalate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/complaints/${complaintId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Escalated by Principal/Admin' }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? 'Escalation failed');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-700">Oversight actions</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={escalate} disabled={loading} className="btn-danger">
        {loading ? 'Escalating…' : 'Escalate to next level'}
      </button>
    </div>
  );
}

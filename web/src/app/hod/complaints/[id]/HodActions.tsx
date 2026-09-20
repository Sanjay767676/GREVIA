'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function HodActions({
  complaintId,
  technicians,
}: {
  complaintId: string;
  technicians: { id: string; full_name: string; username: string }[];
}) {
  const router = useRouter();
  const [staffId, setStaffId] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reassign() {
    if (!staffId) {
      setError('Select a worker first.');
      return;
    }
    setLoading('reassign');
    setError(null);
    try {
      const res = await fetch(`/api/complaints/${complaintId}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: staffId }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? 'Reassign failed');
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function escalate() {
    setLoading('escalate');
    setError(null);
    try {
      const res = await fetch(`/api/complaints/${complaintId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Escalated by HOD' }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? 'Escalation failed');
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-700">HOD actions</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1">
          <label className="label">Reassign to worker</label>
          <select className="input" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            <option value="">— Select worker —</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name || t.username}</option>
            ))}
          </select>
        </div>
        <button onClick={reassign} disabled={loading !== null} className="btn-secondary">
          {loading === 'reassign' ? 'Reassigning…' : 'Reassign'}
        </button>
      </div>
      <div>
        <button onClick={escalate} disabled={loading !== null} className="btn-danger">
          {loading === 'escalate' ? 'Escalating…' : 'Escalate to Principal'}
        </button>
      </div>
    </div>
  );
}

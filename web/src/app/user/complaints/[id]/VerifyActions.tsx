'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Complainant verification actions (PRD §8). Only rendered when the complaint
// is awaiting verification.
export function VerifyActions({ complaintId }: { complaintId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<'YES' | 'NO' | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function verify(decision: 'YES' | 'NO') {
    setLoading(decision);
    setError(null);
    try {
      const res = await fetch(`/api/complaints/${complaintId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Action failed');
        return;
      }
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-800">
        The technician marked this complaint resolved. Is it fixed?
      </p>
      <textarea
        className="input"
        placeholder="Optional note (required context if reopening)…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={() => verify('YES')}
          disabled={loading !== null}
          className="btn-primary"
        >
          {loading === 'YES' ? 'Confirming…' : 'Yes, close it'}
        </button>
        <button
          onClick={() => verify('NO')}
          disabled={loading !== null}
          className="btn-danger"
        >
          {loading === 'NO' ? 'Reopening…' : 'No, reopen'}
        </button>
      </div>
    </div>
  );
}

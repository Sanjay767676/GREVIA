'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { STATUS, type ComplaintStatus } from '@/lib/constants';

export function WorkerActions({
  complaintId,
  status,
}: {
  complaintId: string;
  status: ComplaintStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [proof, setProof] = useState<File | null>(null);

  async function uploadProof(): Promise<string | null> {
    if (!proof) return null;
    const fd = new FormData();
    fd.append('file', proof);
    fd.append('prefix', 'proof');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    return data.path ?? null;
  }

  async function act(action: 'ACCEPT' | 'START' | 'RESOLVE') {
    setLoading(true);
    setError(null);
    try {
      let proofPath: string | null = null;
      if (action === 'RESOLVE' && proof) {
        try {
          proofPath = await uploadProof();
        } catch {
          /* proof optional */
        }
      }
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, resolution_notes: notes, resolution_proof_path: proofPath }),
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
      setLoading(false);
    }
  }

  const acceptableStatuses: ComplaintStatus[] = [STATUS.ASSIGNED, STATUS.REOPENED, STATUS.ESCALATED_TO_HOD];
  const canAccept = acceptableStatuses.includes(status);
  const canStart = status === STATUS.ACCEPTED;
  const canResolve = status === STATUS.IN_PROGRESS || status === STATUS.ACCEPTED;

  if (!canAccept && !canStart && !canResolve) {
    return <p className="text-sm text-slate-500">No actions available for this status.</p>;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-700">Actions</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {canResolve && (
        <div className="space-y-2 rounded-lg border border-slate-200 p-3">
          <label className="label">Completion notes</label>
          <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe what you did to fix it…" />
          <label className="label">Completion proof (optional)</label>
          <input type="file" accept="image/*"
            className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm"
            onChange={(e) => setProof(e.target.files?.[0] ?? null)} />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {canAccept && <button onClick={() => act('ACCEPT')} disabled={loading} className="btn-primary">Accept</button>}
        {canStart && <button onClick={() => act('START')} disabled={loading} className="btn-secondary">Start work</button>}
        {canResolve && (
          <button onClick={() => act('RESOLVE')} disabled={loading} className="btn-primary">
            {loading ? 'Saving…' : 'Mark completed'}
          </button>
        )}
      </div>
    </div>
  );
}

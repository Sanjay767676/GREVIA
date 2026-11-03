import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { api, post } from '../../lib/api';

async function uploadProof(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('prefix', 'proof');
  const data = await api<{ path: string }>('/api/upload', { method: 'POST', body: fd });
  return data.path ?? null;
}

export function WorkerActions({
  complaintId,
  status,
  onDone,
}: {
  complaintId: string;
  status: string;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [proof, setProof] = useState<File | null>(null);

  async function act(action: 'ACCEPT' | 'START' | 'RESOLVE') {
    setLoading(true);
    setError(null);
    try {
      let proofPath: string | null = null;
      if (action === 'RESOLVE' && proof) {
        try {
          proofPath = await uploadProof(proof);
        } catch {
          /* proof optional */
        }
      }
      await post(`/api/complaints/${complaintId}/status`, {
        action,
        resolution_notes: notes,
        resolution_proof_path: proofPath,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  const acceptableStatuses = ['ASSIGNED', 'REOPENED', 'ESCALATED_TO_HOD'];
  const canAccept = acceptableStatuses.includes(status);
  const canStart = status === 'ACCEPTED';
  const canResolve = status === 'IN_PROGRESS' || status === 'ACCEPTED';

  if (!canAccept && !canStart && !canResolve) {
    return (
      <p className="flex items-center gap-2 text-sm text-stone-500">
        <Icon name="checkCircle" className="h-4 w-4 text-emerald-600" />
        No actions available for this status.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {canResolve && (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
          <div>
            <label className="label" htmlFor="notes">
              Completion notes
            </label>
            <textarea
              id="notes"
              className="input min-h-24"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what you did to fix it…"
            />
          </div>
          <div>
            <label className="label" htmlFor="proof">
              Completion proof <span className="font-normal text-stone-400">(optional)</span>
            </label>
            <input
              id="proof"
              type="file"
              accept="image/*"
              className="block w-full text-sm text-stone-500 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-amber-800 file:ring-1 file:ring-amber-200 hover:file:bg-amber-50"
              onChange={(e) => setProof(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {canAccept && (
          <button onClick={() => act('ACCEPT')} disabled={loading} className="btn-primary">
            <Icon name="check" className="h-4 w-4" />
            Accept job
          </button>
        )}
        {canStart && (
          <button onClick={() => act('START')} disabled={loading} className="btn-secondary">
            <Icon name="wrench" className="h-4 w-4" />
            Start work
          </button>
        )}
        {canResolve && (
          <button onClick={() => act('RESOLVE')} disabled={loading} className="btn-primary">
            <Icon name="checkCircle" className="h-4 w-4" />
            {loading ? 'Saving…' : 'Mark completed'}
          </button>
        )}
      </div>
    </div>
  );
}

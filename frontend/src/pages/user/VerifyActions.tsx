import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { post } from '../../lib/api';

// Complainant verification actions (PRD §8). Only rendered when the complaint
// is awaiting verification.
export function VerifyActions({
  complaintId,
  onDone,
}: {
  complaintId: string;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState<'YES' | 'NO' | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function verify(decision: 'YES' | 'NO') {
    setLoading(decision);
    setError(null);
    try {
      await post(`/api/complaints/${complaintId}/verify`, { decision, note });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-emerald-700 ring-1 ring-emerald-200">
          <Icon name="checkCircle" className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-emerald-900">Is your issue fixed?</p>
          <p className="mt-0.5 text-xs text-emerald-800/70">
            The technician marked this resolved. Your confirmation closes it.
          </p>
        </div>
      </div>
      <textarea
        className="input"
        placeholder="Optional note — please explain if you are reopening…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => verify('YES')} disabled={loading !== null} className="btn-primary">
          <Icon name="check" className="h-4 w-4" />
          {loading === 'YES' ? 'Confirming…' : 'Yes, close it'}
        </button>
        <button onClick={() => verify('NO')} disabled={loading !== null} className="btn-danger">
          {loading === 'NO' ? 'Reopening…' : 'No, reopen'}
        </button>
      </div>
    </div>
  );
}

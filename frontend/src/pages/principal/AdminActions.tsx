import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { post } from '../../lib/api';

// Principal/admin oversight: escalate to the next level (e.g. higher authority).
export function AdminActions({
  complaintId,
  onDone,
}: {
  complaintId: string;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function escalate() {
    setLoading(true);
    setError(null);
    try {
      await post(`/api/complaints/${complaintId}/escalate`, {
        reason: 'Escalated by Principal/Admin',
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Escalation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <button onClick={escalate} disabled={loading} className="btn-danger">
        <Icon name="alert" className="h-4 w-4" />
        {loading ? 'Escalating…' : 'Escalate to next level'}
      </button>
      <p className="text-xs text-stone-400">
        Use this only when the HOD has not resolved the complaint within the SLA window.
      </p>
    </div>
  );
}

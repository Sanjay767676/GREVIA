import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { get, post } from '../../lib/api';
import { useAsync } from '../../lib/useAsync';

interface StaffRow {
  id: string;
  full_name: string;
  username: string;
  role: string;
}

export function HodActions({
  complaintId,
  onDone,
}: {
  complaintId: string;
  onDone: () => void;
}) {
  const { data } = useAsync(() => get<{ staff: StaffRow[] }>('/api/staff'), []);
  const technicians = (data?.staff ?? []).filter((s) => s.role === 'TECHNICIAN');
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
      await post(`/api/complaints/${complaintId}/reassign`, { staff_id: staffId });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reassign failed');
    } finally {
      setLoading(null);
    }
  }

  async function escalate() {
    setLoading('escalate');
    setError(null);
    try {
      await post(`/api/complaints/${complaintId}/escalate`, { reason: 'Escalated by HOD' });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Escalation failed');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1">
          <label className="label" htmlFor="reassign-worker">
            Reassign to worker
          </label>
          <select
            id="reassign-worker"
            className="input"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
          >
            <option value="">— Select worker —</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name || t.username}
              </option>
            ))}
          </select>
        </div>
        <button onClick={reassign} disabled={loading !== null} className="btn-secondary">
          <Icon name="users" className="h-4 w-4" />
          {loading === 'reassign' ? 'Reassigning…' : 'Reassign'}
        </button>
      </div>

      <div className="border-t border-amber-100 pt-4">
        <button onClick={escalate} disabled={loading !== null} className="btn-danger">
          <Icon name="alert" className="h-4 w-4" />
          {loading === 'escalate' ? 'Escalating…' : 'Escalate to Principal'}
        </button>
        <p className="mt-2 text-xs text-stone-400">
          Escalating moves this complaint to level 3 and alerts the Principal.
        </p>
      </div>
    </div>
  );
}

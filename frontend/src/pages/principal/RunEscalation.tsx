import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { post } from '../../lib/api';

// Runs the SLA escalation sweep on demand (Principal only). Useful on hosts
// where scheduled cron is limited.
export function RunEscalation({ onDone }: { onDone?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMsg(null);
    try {
      const data = await post<{ checked: number; escalated: number }>(
        '/api/admin/run-escalation',
      );
      setMsg(`Checked ${data.checked}, escalated ${data.escalated}.`);
      onDone?.();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button onClick={run} disabled={loading} className="btn-secondary">
        <Icon name="clock" className="h-4 w-4" />
        {loading ? 'Running…' : 'Run SLA escalation check'}
      </button>
      {msg && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
          <Icon name="checkCircle" className="h-3.5 w-3.5" />
          {msg}
        </span>
      )}
    </div>
  );
}

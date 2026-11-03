import { Icon } from '../../components/Icon';
import { ErrorNote, PageHeader, PageLoader } from '../../components/PageHeader';
import { get } from '../../lib/api';
import { labelOf } from '../../components/StatusBadge';
import type { AuditLog } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';

export function AuditPage() {
  const { data, error, loading } = useAsync(
    () => get<{ logs: AuditLog[] }>('/api/admin/audit?limit=200'),
    [],
  );

  if (loading && !data) return <PageLoader label="Loading audit log…" />;
  if (error) return <ErrorNote message={error} />;

  const logs = data?.logs ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Principal portal"
        title="Audit log"
        description="Every system and human action, newest first."
      />

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/50 px-5 py-3">
          <div className="flex items-center gap-2">
            <Icon name="document" className="h-4 w-4 text-amber-700" />
            <h2 className="font-display text-sm font-bold text-stone-800">
              Immutable event trail
            </h2>
          </div>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-inset ring-amber-200">
            {logs.length} events
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-amber-100 text-left text-[11px] uppercase tracking-wider text-amber-800/70">
              <tr>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-stone-400">
                    No audit events yet.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-amber-50/40">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-stone-700">{labelOf(l.action)}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-stone-500">
                      {l.metadata ? JSON.stringify(l.metadata) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

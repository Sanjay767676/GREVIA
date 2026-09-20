import Link from 'next/link';
import type { Complaint } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/constants';
import { PriorityBadge, StatusBadge } from './StatusBadge';
import { SlaCountdown } from './SlaCountdown';

// Reusable complaint list table. `basePath` controls the detail link prefix
// (e.g. /user/complaints, /worker/complaints).
export function ComplaintTable({
  complaints,
  basePath,
  showSla = true,
  emptyLabel = 'No complaints yet.',
}: {
  complaints: Complaint[];
  basePath: string;
  showSla?: boolean;
  emptyLabel?: string;
}) {
  if (complaints.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-slate-400">{emptyLabel}</div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              {showSla && <th className="px-4 py-3">SLA</th>}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {complaints.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                  {c.code}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{c.title}</p>
                  <p className="text-xs text-slate-400">{c.location}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {c.category ? CATEGORY_LABELS[c.category] : '—'}
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={c.priority} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} />
                </td>
                {showSla && (
                  <td className="whitespace-nowrap px-4 py-3 text-xs">
                    <SlaCountdown deadline={c.sla_deadline_at} />
                  </td>
                )}
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`${basePath}/${c.id}`}
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

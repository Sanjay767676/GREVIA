import { Link } from 'react-router-dom';
import type { Complaint } from '../lib/types';
import { CATEGORY_LABELS } from '../lib/constants';
import { PriorityBadge, StatusBadge } from './StatusBadge';
import { SlaCountdown } from './SlaCountdown';
import { Icon } from './Icon';

// Reusable complaint list. Table on desktop, cards on mobile.
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
      <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200">
          <Icon name="document" className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-stone-600">{emptyLabel}</p>
        <p className="text-xs text-stone-400">New items will appear here as they come in.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="card hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-amber-100 bg-amber-50/60 text-left font-display text-[11px] uppercase tracking-wider text-amber-800/70">
              <tr>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Complaint</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                {showSla && <th className="px-4 py-3 font-semibold">SLA</th>}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-50">
              {complaints.map((c) => (
                <tr key={c.id} className="group transition-colors hover:bg-amber-50/40">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-amber-800/50">
                    {c.code}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-stone-800 group-hover:text-amber-900">{c.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-400">
                      <Icon name="building" className="h-3 w-3" />
                      {c.location}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
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
                      to={`${basePath}/${c.id}`}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
                    >
                      View
                      <Icon name="chevronRight" className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {complaints.map((c) => (
          <li key={c.id}>
            <Link
              to={`${basePath}/${c.id}`}
              className="card block p-4 transition-colors hover:border-amber-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] text-amber-800/50">{c.code}</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-stone-900">{c.title}</p>
                  <p className="mt-0.5 truncate text-xs text-stone-400">{c.location}</p>
                </div>
                <Icon name="chevronRight" className="mt-1 h-4 w-4 shrink-0 text-amber-500" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <StatusBadge status={c.status} />
                <PriorityBadge priority={c.priority} />
                {c.category && (
                  <span className="badge bg-amber-50 text-amber-800 ring-amber-200">
                    {CATEGORY_LABELS[c.category]}
                  </span>
                )}
              </div>
              {showSla && (
                <div className="mt-3 flex items-center gap-1.5 border-t border-amber-100 pt-2.5 text-xs">
                  <Icon name="clock" className="h-3.5 w-3.5 text-amber-600" />
                  <SlaCountdown deadline={c.sla_deadline_at} />
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

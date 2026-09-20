import type { ComplaintHistory } from '@/lib/types';

// Vertical complaint timeline (PRD §7 lifecycle events).
export function Timeline({ events }: { events: ComplaintHistory[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-400">No history yet.</p>;
  }
  return (
    <ol className="relative space-y-4 border-l border-slate-200 pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-500" />
          <p className="text-sm font-medium text-slate-800">
            {e.action.replaceAll('_', ' ')}
            {e.to_status && (
              <span className="ml-2 text-xs font-normal text-slate-500">
                → {e.to_status.replaceAll('_', ' ')}
              </span>
            )}
          </p>
          {e.note && <p className="mt-0.5 text-sm text-slate-500">{e.note}</p>}
          <p className="mt-0.5 text-[11px] text-slate-400">
            {new Date(e.created_at).toLocaleString()}
          </p>
        </li>
      ))}
    </ol>
  );
}

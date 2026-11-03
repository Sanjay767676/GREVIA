import type { ComplaintHistory } from '../lib/types';
import { Icon } from './Icon';
import { labelOf } from './StatusBadge';

export function Timeline({ events }: { events: ComplaintHistory[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200">
          <Icon name="clock" className="h-5 w-5" />
        </span>
        <p className="text-sm text-stone-500">No history yet.</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-5 border-l border-amber-200 pl-5">
      {events.map((e, i) => (
        <li key={e.id} className="relative">
          <span
            className={`absolute -left-[25px] top-1 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-white ${
              i === events.length - 1 ? 'bg-amber-500' : 'bg-amber-300'
            }`}
          />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-display text-sm font-semibold text-stone-800">{labelOf(e.action)}</p>
            {e.to_status && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                {e.to_status.replaceAll('_', ' ')}
              </span>
            )}
          </div>
          {e.note && <p className="mt-1 text-sm leading-relaxed text-stone-500">{e.note}</p>}
          <p className="mt-1 flex items-center gap-1 text-[11px] text-stone-400">
            <Icon name="clock" className="h-3 w-3" />
            {new Date(e.created_at).toLocaleString()}
          </p>
        </li>
      ))}
    </ol>
  );
}

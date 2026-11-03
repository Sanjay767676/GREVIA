import { Icon } from './Icon';

export function BarList({
  items,
  emptyLabel = 'No data.',
}: {
  items: { label: string; count: number }[];
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200">
          <Icon name="chart" className="h-5 w-5" />
        </span>
        <p className="text-sm text-stone-400">{emptyLabel}</p>
      </div>
    );
  }
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-stone-600">{i.label}</span>
            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold tabular-nums text-amber-800 ring-1 ring-inset ring-amber-200">
              {i.count}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-amber-100/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
              style={{ width: `${Math.max((i.count / max) * 100, 4)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

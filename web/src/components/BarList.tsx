// Simple horizontal bar list for distributions (no chart lib dependency).
export function BarList({
  items,
  emptyLabel = 'No data.',
}: {
  items: { label: string; count: number }[];
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">{emptyLabel}</p>;
  }
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-slate-600">{i.label}</span>
            <span className="font-medium text-slate-800">{i.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${(i.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

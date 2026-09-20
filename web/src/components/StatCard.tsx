export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: 'default' | 'warning' | 'danger' | 'success';
}) {
  const valueClass =
    accent === 'danger'
      ? 'text-red-600'
      : accent === 'warning'
        ? 'text-amber-600'
        : accent === 'success'
          ? 'text-emerald-600'
          : 'text-slate-900';
  const barClass =
    accent === 'danger'
      ? 'from-red-400 to-red-500'
      : accent === 'warning'
        ? 'from-amber-300 to-amber-500'
        : accent === 'success'
          ? 'from-emerald-300 to-emerald-500'
          : 'from-brand-400 to-brand-600';
  return (
    <div className="card card-hover relative overflow-hidden p-4">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${barClass}`}
      />
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-extrabold tabular-nums ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

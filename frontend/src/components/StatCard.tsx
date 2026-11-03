import { Icon, type IconName } from './Icon';

const ACCENTS = {
  default: {
    bar: 'bg-amber-400',
    icon: 'bg-amber-50 text-amber-700 ring-amber-200',
    value: 'text-stone-900',
  },
  warning: {
    bar: 'bg-orange-400',
    icon: 'bg-orange-50 text-orange-700 ring-orange-200',
    value: 'text-orange-700',
  },
  danger: {
    bar: 'bg-red-500',
    icon: 'bg-red-50 text-red-700 ring-red-200',
    value: 'text-red-700',
  },
  success: {
    bar: 'bg-emerald-500',
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    value: 'text-emerald-700',
  },
} as const;

export function StatCard({
  label,
  value,
  accent = 'default',
  icon,
  hint,
}: {
  label: string;
  value: number | string;
  accent?: keyof typeof ACCENTS;
  icon?: IconName;
  hint?: string;
}) {
  const theme = ACCENTS[accent];

  return (
    <div className="card card-hover relative overflow-hidden p-4">
      <div className={`absolute inset-x-0 top-0 h-1 ${theme.bar}`} />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            {label}
          </p>
          <p className={`mt-2 font-display text-3xl font-extrabold leading-none tabular-nums ${theme.value}`}>
            {value}
          </p>
          {hint && <p className="mt-1.5 text-[11px] text-stone-400">{hint}</p>}
        </div>
        {icon && (
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 ring-inset ${theme.icon}`}>
            <Icon name={icon} className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>
    </div>
  );
}

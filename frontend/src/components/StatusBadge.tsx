import { PRIORITY, STATUS, type ComplaintStatus, type Priority } from '../lib/constants';

const STATUS_STYLES: Record<string, string> = {
  [STATUS.SUBMITTED]: 'bg-stone-100 text-stone-700 ring-stone-200',
  [STATUS.CLASSIFIED]: 'bg-stone-100 text-stone-700 ring-stone-200',
  [STATUS.ASSIGNED]: 'bg-blue-50 text-blue-700 ring-blue-200',
  [STATUS.ACCEPTED]: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  [STATUS.IN_PROGRESS]: 'bg-amber-50 text-amber-800 ring-amber-300',
  [STATUS.RESOLVED]: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  [STATUS.USER_VERIFICATION]: 'bg-violet-50 text-violet-700 ring-violet-200',
  [STATUS.CLOSED]: 'bg-green-50 text-green-700 ring-green-200',
  [STATUS.REOPENED]: 'bg-orange-50 text-orange-700 ring-orange-200',
  [STATUS.ESCALATED_TO_HOD]: 'bg-red-50 text-red-700 ring-red-200',
  [STATUS.ESCALATED_TO_PRINCIPAL]: 'bg-red-100 text-red-800 ring-red-300',
  [STATUS.ESCALATED_TO_HIGHER_AUTHORITY]: 'bg-red-200 text-red-900 ring-red-400',
};

const PRIORITY_STYLES: Record<string, string> = {
  [PRIORITY.CRITICAL]: 'bg-red-50 text-red-700 ring-red-200',
  [PRIORITY.HIGH]: 'bg-orange-50 text-orange-700 ring-orange-200',
  [PRIORITY.MEDIUM]: 'bg-amber-50 text-amber-800 ring-amber-200',
  [PRIORITY.LOW]: 'bg-stone-100 text-stone-600 ring-stone-200',
};

export function labelOf(value: string) {
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] ?? 'bg-stone-100 text-stone-700 ring-stone-200'}`}>
      {labelOf(status)}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority | null }) {
  if (!priority) {
    return <span className="badge bg-stone-100 text-stone-500 ring-stone-200">—</span>;
  }
  return (
    <span className={`badge ${PRIORITY_STYLES[priority] ?? 'bg-stone-100 text-stone-600 ring-stone-200'}`}>
      {labelOf(priority)}
    </span>
  );
}

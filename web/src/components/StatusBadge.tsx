import { STATUS, PRIORITY, type ComplaintStatus, type Priority } from '@/lib/constants';

const STATUS_STYLES: Record<string, string> = {
  [STATUS.SUBMITTED]: 'bg-slate-50 text-slate-700 ring-slate-200',
  [STATUS.CLASSIFIED]: 'bg-slate-50 text-slate-700 ring-slate-200',
  [STATUS.ASSIGNED]: 'bg-blue-50 text-blue-700 ring-blue-200',
  [STATUS.ACCEPTED]: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  [STATUS.IN_PROGRESS]: 'bg-amber-50 text-amber-700 ring-amber-200',
  [STATUS.RESOLVED]: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  [STATUS.USER_VERIFICATION]: 'bg-purple-50 text-purple-700 ring-purple-200',
  [STATUS.CLOSED]: 'bg-green-50 text-green-700 ring-green-200',
  [STATUS.REOPENED]: 'bg-orange-50 text-orange-700 ring-orange-200',
  [STATUS.ESCALATED_TO_HOD]: 'bg-red-50 text-red-700 ring-red-200',
  [STATUS.ESCALATED_TO_PRINCIPAL]: 'bg-red-100 text-red-800 ring-red-300',
  [STATUS.ESCALATED_TO_HIGHER_AUTHORITY]: 'bg-red-200 text-red-900 ring-red-400',
};

const PRIORITY_STYLES: Record<string, string> = {
  [PRIORITY.CRITICAL]: 'bg-red-50 text-red-700 ring-red-200',
  [PRIORITY.HIGH]: 'bg-orange-50 text-orange-700 ring-orange-200',
  [PRIORITY.MEDIUM]: 'bg-yellow-50 text-yellow-700 ring-yellow-200',
  [PRIORITY.LOW]: 'bg-slate-50 text-slate-600 ring-slate-200',
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] ?? 'bg-slate-50 text-slate-700 ring-slate-200'}`}>
      {status.replaceAll('_', ' ')}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority | null }) {
  if (!priority)
    return <span className="badge bg-slate-50 text-slate-500 ring-slate-200">—</span>;
  return (
    <span className={`badge ${PRIORITY_STYLES[priority] ?? 'bg-slate-50 text-slate-600 ring-slate-200'}`}>
      {priority}
    </span>
  );
}

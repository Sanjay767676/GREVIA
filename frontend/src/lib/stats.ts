import { OPEN_STATUSES, STATUS, type ComplaintStatus } from './constants';
import type { Complaint, Stats } from './types';
import { isOverdue } from './sla';

const PENDING: ComplaintStatus[] = [
  STATUS.SUBMITTED,
  STATUS.CLASSIFIED,
  STATUS.ASSIGNED,
  STATUS.ACCEPTED,
  STATUS.REOPENED,
];

const ESCALATED: ComplaintStatus[] = [
  STATUS.ESCALATED_TO_HOD,
  STATUS.ESCALATED_TO_PRINCIPAL,
  STATUS.ESCALATED_TO_HIGHER_AUTHORITY,
];

export function computeStats(complaints: Complaint[]): Stats {
  const stats: Stats = {
    total: complaints.length,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    escalated: 0,
    overdue: 0,
  };

  for (const c of complaints) {
    if (PENDING.includes(c.status)) stats.pending += 1;
    if (c.status === STATUS.IN_PROGRESS) stats.inProgress += 1;
    if (c.status === STATUS.RESOLVED || c.status === STATUS.USER_VERIFICATION) stats.resolved += 1;
    if (c.status === STATUS.CLOSED) stats.closed += 1;
    if (ESCALATED.includes(c.status)) stats.escalated += 1;
    if (OPEN_STATUSES.includes(c.status) && isOverdue(c.sla_deadline_at)) stats.overdue += 1;
  }

  return stats;
}

import { ComplaintTable } from '../../components/ComplaintTable';
import { Icon } from '../../components/Icon';
import { ErrorNote, PageHeader, PageLoader, SectionHeading } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { get } from '../../lib/api';
import { STATUS } from '../../lib/constants';
import { isDueSoon, isOverdue } from '../../lib/sla';
import type { Complaint } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';

export function WorkerDashboard() {
  const { data, error, loading } = useAsync(
    () => get<{ complaints: Complaint[] }>('/api/complaints'),
    [],
  );

  if (loading && !data) return <PageLoader label="Loading your queue…" />;
  if (error) return <ErrorNote message={error} />;

  const complaints = data?.complaints ?? [];
  const active = complaints.filter(
    (c) =>
      c.status !== STATUS.CLOSED &&
      c.status !== STATUS.USER_VERIFICATION &&
      c.status !== STATUS.RESOLVED,
  );
  const overdue = active.filter((c) => isOverdue(c.sla_deadline_at));
  const dueSoon = active.filter(
    (c) => !isOverdue(c.sla_deadline_at) && isDueSoon(c.sla_deadline_at, c.sla_start_at),
  );
  const resolved = complaints.filter(
    (c) =>
      c.status === STATUS.RESOLVED ||
      c.status === STATUS.USER_VERIFICATION ||
      c.status === STATUS.CLOSED,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Technician portal"
        title="My work queue"
        description="Accept jobs, update progress, and submit proof when the repair is done."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Active jobs" value={active.length} icon="wrench" />
        <StatCard label="Overdue" value={overdue.length} accent="danger" icon="alert" />
        <StatCard label="Due soon" value={dueSoon.length} accent="warning" icon="clock" />
        <StatCard label="Resolved" value={resolved.length} accent="success" icon="checkCircle" />
      </div>

      {overdue.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-red-100 text-red-700 ring-1 ring-red-200">
            <Icon name="alert" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-red-800">
              {overdue.length} job{overdue.length === 1 ? ' is' : 's are'} past the SLA deadline
            </p>
            <p className="mt-0.5 text-xs text-red-700/80">
              These have been or will be escalated to your HOD. Prioritise them first.
            </p>
          </div>
        </div>
      )}

      {overdue.length > 0 && (
        <section>
          <SectionHeading title="Overdue" count={overdue.length} />
          <ComplaintTable complaints={overdue} basePath="/worker/complaints" />
        </section>
      )}

      <section>
        <SectionHeading title="Active" count={active.length} />
        <ComplaintTable
          complaints={active}
          basePath="/worker/complaints"
          emptyLabel="No active complaints assigned to you."
        />
      </section>

      <section>
        <SectionHeading title="Resolved / closed" count={resolved.length} />
        <ComplaintTable
          complaints={resolved}
          basePath="/worker/complaints"
          emptyLabel="Nothing resolved yet."
        />
      </section>
    </div>
  );
}

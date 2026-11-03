import { BarList } from '../../components/BarList';
import { ComplaintTable } from '../../components/ComplaintTable';
import { Icon } from '../../components/Icon';
import { ErrorNote, PageHeader, PageLoader, SectionHeading } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { get } from '../../lib/api';
import { avgResolutionHours, categoryDistribution } from '../../lib/analytics';
import { computeStats } from '../../lib/stats';
import type { Complaint } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';

export function HodDashboard() {
  const { data, error, loading } = useAsync(
    () => get<{ complaints: Complaint[] }>('/api/complaints'),
    [],
  );

  if (loading && !data) return <PageLoader label="Loading department dashboard…" />;
  if (error) return <ErrorNote message={error} />;

  const complaints = data?.complaints ?? [];
  const stats = computeStats(complaints);
  const avg = avgResolutionHours(complaints);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="HOD portal"
        title="Department dashboard"
        description="Monitor SLA health, clear escalations, and reassign work in your department."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={stats.total} icon="document" />
        <StatCard label="Pending" value={stats.pending} accent="warning" icon="clock" />
        <StatCard label="Overdue" value={stats.overdue} accent="danger" icon="alert" />
        <StatCard label="Escalated" value={stats.escalated} accent="danger" icon="shield" />
        <StatCard label="Closed" value={stats.closed} accent="success" icon="checkCircle" />
        <StatCard label="Avg resolve (h)" value={avg ?? '—'} icon="chart" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionHeading title="Recent department complaints" />
          <ComplaintTable
            complaints={complaints.slice(0, 10)}
            basePath="/hod/complaints"
            emptyLabel="No complaints in your department yet."
          />
        </div>

        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="panel-head">
              <Icon name="chart" className="h-4 w-4 text-amber-700" />
              <h2 className="font-display text-sm font-bold text-stone-800">Category split</h2>
            </div>
            <div className="p-5">
              <BarList items={categoryDistribution(complaints)} />
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
              <Icon name="alert" className="h-4 w-4" />
              Escalation watch
            </div>
            <p className="mt-2 text-xs leading-relaxed text-amber-900/70">
              Complaints past the worker SLA move to your queue automatically. Reassign or resolve
              them before the HOD timer expires.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

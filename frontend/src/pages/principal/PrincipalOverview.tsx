import { BarList } from '../../components/BarList';
import { ComplaintTable } from '../../components/ComplaintTable';
import { Icon } from '../../components/Icon';
import { ErrorNote, PageHeader, PageLoader, SectionHeading } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { get } from '../../lib/api';
import { avgResolutionHours, categoryDistribution } from '../../lib/analytics';
import { computeStats } from '../../lib/stats';
import type { Complaint, Department } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { RunEscalation } from './RunEscalation';

export function PrincipalOverview() {
  const { data, error, loading, reload } = useAsync(
    () =>
      Promise.all([
        get<{ complaints: Complaint[] }>('/api/complaints'),
        get<{ departments: Department[] }>('/api/departments'),
      ]),
    [],
  );

  if (loading && !data) return <PageLoader label="Loading college overview…" />;
  if (error) return <ErrorNote message={error} />;

  const complaints = data?.[0].complaints ?? [];
  const departments = data?.[1].departments ?? [];
  const stats = computeStats(complaints);
  const avg = avgResolutionHours(complaints);

  const deptNames = new Map(departments.map((d) => [d.id, d.name]));
  const deptCounts = new Map<string, number>();
  for (const c of complaints) {
    const name = c.department_id ? deptNames.get(c.department_id) ?? 'Unknown' : 'Unassigned';
    deptCounts.set(name, (deptCounts.get(name) ?? 0) + 1);
  }
  const deptDist = Array.from(deptCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Principal portal"
        title="College-wide overview"
        description="See every grievance, spot bottlenecks, and keep SLAs on track."
        actions={<RunEscalation onDone={reload} />}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={stats.total} icon="document" />
        <StatCard label="Pending" value={stats.pending} accent="warning" icon="clock" />
        <StatCard label="Overdue" value={stats.overdue} accent="danger" icon="alert" />
        <StatCard label="Escalated" value={stats.escalated} accent="danger" icon="shield" />
        <StatCard label="Closed" value={stats.closed} accent="success" icon="checkCircle" />
        <StatCard label="Avg resolve (h)" value={avg ?? '—'} icon="chart" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="panel-head">
            <Icon name="building" className="h-4 w-4 text-amber-700" />
            <h2 className="font-display text-sm font-bold text-stone-800">By department</h2>
          </div>
          <div className="p-5">
            <BarList items={deptDist} />
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="panel-head">
            <Icon name="filter" className="h-4 w-4 text-amber-700" />
            <h2 className="font-display text-sm font-bold text-stone-800">By category</h2>
          </div>
          <div className="p-5">
            <BarList items={categoryDistribution(complaints)} />
          </div>
        </div>
      </div>

      <section>
        <SectionHeading
          title="Recent complaints"
          count={complaints.length > 10 ? 10 : complaints.length}
        />
        <ComplaintTable
          complaints={complaints.slice(0, 10)}
          basePath="/principal/complaints"
          emptyLabel="No complaints yet."
        />
      </section>
    </div>
  );
}

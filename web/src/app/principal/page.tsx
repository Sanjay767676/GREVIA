import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { computeStats } from '@/lib/stats';
import { avgResolutionHours, categoryDistribution } from '@/lib/analytics';
import { StatCard } from '@/components/StatCard';
import { BarList } from '@/components/BarList';
import { ComplaintTable } from '@/components/ComplaintTable';
import type { Complaint, Department } from '@/lib/types';

export default async function PrincipalOverview() {
  await requireRole([ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);
  const supabase = db();

  const [{ data: complaintsData }, { data: deptsData }] = await Promise.all([
    supabase.from('complaints').select('*').order('created_at', { ascending: false }),
    supabase.from('departments').select('*'),
  ]);

  const complaints = (complaintsData ?? []) as Complaint[];
  const departments = (deptsData ?? []) as Department[];
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
      <div>
        <h1 className="text-xl font-semibold text-slate-900">College-wide overview</h1>
        <p className="text-sm text-slate-500">All complaints across departments.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} accent="warning" />
        <StatCard label="Overdue" value={stats.overdue} accent="danger" />
        <StatCard label="Escalated" value={stats.escalated} accent="danger" />
        <StatCard label="Closed" value={stats.closed} accent="success" />
        <StatCard label="Avg resolve (h)" value={avg ?? '—'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">By department</h2>
          <BarList items={deptDist} />
        </div>
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">By category</h2>
          <BarList items={categoryDistribution(complaints)} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Recent complaints</h2>
        <ComplaintTable complaints={complaints.slice(0, 10)} basePath="/principal/complaints" emptyLabel="No complaints yet." />
      </div>
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { computeStats } from '@/lib/stats';
import { avgResolutionHours, categoryDistribution } from '@/lib/analytics';
import { StatCard } from '@/components/StatCard';
import { ComplaintTable } from '@/components/ComplaintTable';
import { BarList } from '@/components/BarList';
import type { Complaint } from '@/lib/types';

export default async function HodDashboard() {
  await requireRole([ROLES.HOD]);
  const supabase = createClient();
  // RLS restricts HOD to their own department automatically.
  const { data } = await supabase
    .from('complaints')
    .select('*')
    .order('created_at', { ascending: false });
  const complaints = (data ?? []) as Complaint[];

  const stats = computeStats(complaints);
  const avg = avgResolutionHours(complaints);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Department dashboard</h1>
        <p className="text-sm text-slate-500">Complaints in your department.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} accent="warning" />
        <StatCard label="Overdue" value={stats.overdue} accent="danger" />
        <StatCard label="Escalated" value={stats.escalated} accent="danger" />
        <StatCard label="Closed" value={stats.closed} accent="success" />
        <StatCard label="Avg resolve (h)" value={avg ?? '—'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">All department complaints</h2>
          <ComplaintTable
            complaints={complaints.slice(0, 10)}
            basePath="/hod/complaints"
            emptyLabel="No complaints in your department yet."
          />
        </div>
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Category distribution</h2>
          <BarList items={categoryDistribution(complaints)} />
        </div>
      </div>
    </div>
  );
}

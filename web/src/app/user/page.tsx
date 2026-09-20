import Link from 'next/link';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { computeStats } from '@/lib/stats';
import { StatCard } from '@/components/StatCard';
import { ComplaintTable } from '@/components/ComplaintTable';
import type { Complaint } from '@/lib/types';

export default async function UserDashboard() {
  const user = await requireRole([ROLES.STUDENT, ROLES.FACULTY]);
  const { data } = await db()
    .from('complaints')
    .select('*')
    .eq('created_by', user.sub)
    .order('created_at', { ascending: false });
  const complaints = (data ?? []) as Complaint[];
  const stats = computeStats(complaints);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Your complaints at a glance.</p>
        </div>
        <Link href="/user/new" className="btn-primary">+ New complaint</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} accent="warning" />
        <StatCard label="In progress" value={stats.inProgress} />
        <StatCard label="Resolved" value={stats.resolved} accent="success" />
        <StatCard label="Closed" value={stats.closed} accent="success" />
        <StatCard label="Escalated" value={stats.escalated} accent="danger" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Recent complaints</h2>
        <ComplaintTable
          complaints={complaints.slice(0, 8)}
          basePath="/user/complaints"
          emptyLabel="You haven't submitted any complaints yet."
        />
      </div>
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { ROLES, STATUS } from '@/lib/constants';
import { isDueSoon, isOverdue } from '@/lib/engines/sla';
import { StatCard } from '@/components/StatCard';
import { ComplaintTable } from '@/components/ComplaintTable';
import type { Complaint } from '@/lib/types';

export default async function WorkerDashboard() {
  const profile = await requireRole([ROLES.TECHNICIAN]);
  const supabase = createClient();
  const { data } = await supabase
    .from('complaints')
    .select('*')
    .eq('assigned_to', profile.id)
    .order('sla_deadline_at', { ascending: true });

  const complaints = (data ?? []) as Complaint[];

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
      <div>
        <h1 className="text-xl font-semibold text-slate-900">My queue</h1>
        <p className="text-sm text-slate-500">Complaints assigned to you.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Assigned (active)" value={active.length} />
        <StatCard label="Overdue" value={overdue.length} accent="danger" />
        <StatCard label="Due soon" value={dueSoon.length} accent="warning" />
        <StatCard label="Resolved" value={resolved.length} accent="success" />
      </div>

      {overdue.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-red-600">Overdue</h2>
          <ComplaintTable complaints={overdue} basePath="/worker/complaints" />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Active</h2>
        <ComplaintTable
          complaints={active}
          basePath="/worker/complaints"
          emptyLabel="No active complaints assigned to you."
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Resolved / closed</h2>
        <ComplaintTable
          complaints={resolved}
          basePath="/worker/complaints"
          emptyLabel="Nothing resolved yet."
        />
      </section>
    </div>
  );
}

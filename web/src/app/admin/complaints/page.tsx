import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { ROLES, STATUS, type ComplaintStatus } from '@/lib/constants';
import { ComplaintTable } from '@/components/ComplaintTable';
import type { Complaint } from '@/lib/types';

export default async function AdminComplaints() {
  await requireRole([ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);
  const supabase = createClient();
  const { data } = await supabase
    .from('complaints')
    .select('*')
    .order('created_at', { ascending: false });
  const complaints = (data ?? []) as Complaint[];

  const escalationStatuses: ComplaintStatus[] = [
    STATUS.ESCALATED_TO_PRINCIPAL,
    STATUS.ESCALATED_TO_HIGHER_AUTHORITY,
  ];
  const escalations = complaints.filter((c) =>
    escalationStatuses.includes(c.status),
  );

  return (
    <div className="space-y-6">
      <section>
        <h1 className="mb-3 text-xl font-semibold text-slate-900">
          Escalations at your level
        </h1>
        <ComplaintTable
          complaints={escalations}
          basePath="/admin/complaints"
          emptyLabel="No complaints escalated to Principal / higher authority."
        />
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">All complaints</h2>
        <ComplaintTable
          complaints={complaints}
          basePath="/admin/complaints"
          emptyLabel="No complaints yet."
        />
      </section>
    </div>
  );
}

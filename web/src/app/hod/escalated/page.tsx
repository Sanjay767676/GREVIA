import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { ROLES, STATUS } from '@/lib/constants';
import { isOverdue } from '@/lib/engines/sla';
import { ComplaintTable } from '@/components/ComplaintTable';
import type { Complaint } from '@/lib/types';

export default async function HodEscalated() {
  await requireRole([ROLES.HOD]);
  const supabase = createClient();
  const { data } = await supabase
    .from('complaints')
    .select('*')
    .order('sla_deadline_at', { ascending: true });
  const complaints = (data ?? []) as Complaint[];

  const escalated = complaints.filter(
    (c) =>
      c.status === STATUS.ESCALATED_TO_HOD ||
      c.status === STATUS.ESCALATED_TO_PRINCIPAL ||
      c.status === STATUS.ESCALATED_TO_HIGHER_AUTHORITY,
  );
  const violations = complaints.filter((c) => isOverdue(c.sla_deadline_at));

  return (
    <div className="space-y-6">
      <section>
        <h1 className="mb-3 text-xl font-semibold text-slate-900">Escalated to me</h1>
        <ComplaintTable
          complaints={escalated}
          basePath="/hod/complaints"
          emptyLabel="No escalated complaints."
        />
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold text-red-600">SLA violations</h2>
        <ComplaintTable
          complaints={violations}
          basePath="/hod/complaints"
          emptyLabel="No SLA violations."
        />
      </section>
    </div>
  );
}

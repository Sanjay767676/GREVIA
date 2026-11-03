import { ComplaintTable } from '../../components/ComplaintTable';
import { ErrorNote, PageHeader, PageLoader, SectionHeading } from '../../components/PageHeader';
import { get } from '../../lib/api';
import { STATUS } from '../../lib/constants';
import { isOverdue } from '../../lib/sla';
import type { Complaint } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';

export function HodEscalated() {
  const { data, error, loading } = useAsync(
    () => get<{ complaints: Complaint[] }>('/api/complaints'),
    [],
  );

  if (loading && !data) return <PageLoader label="Loading escalations…" />;
  if (error) return <ErrorNote message={error} />;

  const complaints = data?.complaints ?? [];
  const escalated = complaints.filter(
    (c) =>
      c.status === STATUS.ESCALATED_TO_HOD ||
      c.status === STATUS.ESCALATED_TO_PRINCIPAL ||
      c.status === STATUS.ESCALATED_TO_HIGHER_AUTHORITY,
  );
  const violations = complaints.filter((c) => isOverdue(c.sla_deadline_at));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="HOD portal"
        title="Escalations"
        description="Complaints that breached the worker SLA and need your attention."
      />

      <section>
        <SectionHeading title="Escalated to me" count={escalated.length} />
        <ComplaintTable
          complaints={escalated}
          basePath="/hod/complaints"
          emptyLabel="No escalated complaints."
        />
      </section>

      <section>
        <SectionHeading title="SLA violations" count={violations.length} />
        <ComplaintTable
          complaints={violations}
          basePath="/hod/complaints"
          emptyLabel="No SLA violations."
        />
      </section>
    </div>
  );
}

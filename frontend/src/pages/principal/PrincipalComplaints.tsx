import { ComplaintTable } from '../../components/ComplaintTable';
import { ErrorNote, PageHeader, PageLoader, SectionHeading } from '../../components/PageHeader';
import { get } from '../../lib/api';
import { STATUS } from '../../lib/constants';
import type { Complaint } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';

export function PrincipalComplaints() {
  const { data, error, loading } = useAsync(
    () => get<{ complaints: Complaint[] }>('/api/complaints'),
    [],
  );

  if (loading && !data) return <PageLoader label="Loading complaints…" />;
  if (error) return <ErrorNote message={error} />;

  const complaints = data?.complaints ?? [];
  const escalationStatuses: string[] = [
    STATUS.ESCALATED_TO_PRINCIPAL,
    STATUS.ESCALATED_TO_HIGHER_AUTHORITY,
  ];
  const escalations = complaints.filter((c) => escalationStatuses.includes(c.status));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Principal portal"
        title="Complaints"
        description="Review level-3 escalations and the full college-wide register."
      />

      <section>
        <SectionHeading title="Escalated to your level" count={escalations.length} />
        <ComplaintTable
          complaints={escalations}
          basePath="/principal/complaints"
          emptyLabel="No complaints escalated to the Principal."
        />
      </section>

      <section>
        <SectionHeading title="All complaints" count={complaints.length} />
        <ComplaintTable
          complaints={complaints}
          basePath="/principal/complaints"
          emptyLabel="No complaints yet."
        />
      </section>
    </div>
  );
}

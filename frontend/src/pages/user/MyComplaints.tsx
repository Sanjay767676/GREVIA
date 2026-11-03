import { Link } from 'react-router-dom';
import { ComplaintTable } from '../../components/ComplaintTable';
import { Icon } from '../../components/Icon';
import { ErrorNote, PageHeader, PageLoader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { get } from '../../lib/api';
import { computeStats } from '../../lib/stats';
import type { Complaint } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';

export function MyComplaints() {
  const { data, error, loading } = useAsync(
    () => get<{ complaints: Complaint[] }>('/api/complaints'),
    [],
  );

  if (loading && !data) return <PageLoader label="Loading your complaints…" />;
  if (error) return <ErrorNote message={error} />;

  const complaints = data?.complaints ?? [];
  const stats = computeStats(complaints);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student / Faculty"
        title="My complaints"
        description="Every grievance you have filed, newest first."
        actions={
          <Link to="/user/new" className="btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            New complaint
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon="document" />
        <StatCard
          label="Open"
          value={stats.pending + stats.inProgress}
          accent="warning"
          icon="clock"
        />
        <StatCard
          label="Resolved"
          value={stats.resolved + stats.closed}
          accent="success"
          icon="checkCircle"
        />
        <StatCard label="Escalated" value={stats.escalated} accent="danger" icon="alert" />
      </div>

      <ComplaintTable
        complaints={complaints}
        basePath="/user/complaints"
        emptyLabel="You haven't submitted any complaints yet."
      />
    </div>
  );
}

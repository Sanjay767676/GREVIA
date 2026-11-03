import { Link } from 'react-router-dom';
import { ComplaintTable } from '../../components/ComplaintTable';
import { Icon } from '../../components/Icon';
import { PageHeader, PageLoader, SectionHeading, ErrorNote } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { useAuth } from '../../lib/auth';
import { ROLES } from '../../lib/constants';
import { computeStats } from '../../lib/stats';
import type { Complaint } from '../../lib/types';
import { get } from '../../lib/api';
import { useAsync } from '../../lib/useAsync';

export function UserDashboard() {
  const { user } = useAuth();
  const { data, error, loading } = useAsync(
    () => get<{ complaints: Complaint[] }>('/api/complaints'),
    [],
  );

  if (loading && !data) return <PageLoader label="Loading your dashboard…" />;
  if (error) return <ErrorNote message={error} />;

  const complaints = data?.complaints ?? [];
  const stats = computeStats(complaints);
  const firstName = (user?.full_name || user?.username || '').split(' ')[0];
  const open = stats.pending + stats.inProgress + stats.escalated;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={user?.role === ROLES.FACULTY ? 'Faculty portal' : 'Student portal'}
        title={`Welcome back, ${firstName}`}
        description="Track your grievances and confirm when they are fixed."
        actions={
          <Link to="/user/new" className="btn-primary">
            <Icon name="plus" className="h-4 w-4" />
            New complaint
          </Link>
        }
      />

      {open === 0 && complaints.length === 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-200/40 blur-2xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-sm">
                <Icon name="spark" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold text-stone-900">
                  Nothing reported yet
                </h2>
                <p className="mt-0.5 max-w-md text-sm text-stone-600">
                  If something on campus is broken, late, or unsafe, file it here. It gets
                  classified and routed automatically.
                </p>
              </div>
            </div>
            <Link to="/user/new" className="btn-secondary">
              File your first complaint
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={stats.total} icon="document" />
        <StatCard label="Pending" value={stats.pending} accent="warning" icon="clock" />
        <StatCard label="In progress" value={stats.inProgress} icon="wrench" />
        <StatCard label="Resolved" value={stats.resolved} accent="success" icon="checkCircle" />
        <StatCard label="Closed" value={stats.closed} accent="success" icon="check" />
        <StatCard label="Escalated" value={stats.escalated} accent="danger" icon="alert" />
      </div>

      <section>
        <SectionHeading
          title="Recent complaints"
          actions={
            complaints.length > 8 ? (
              <Link
                to="/user/complaints"
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline"
              >
                View all
                <Icon name="chevronRight" className="h-3 w-3" />
              </Link>
            ) : null
          }
        />
        <ComplaintTable
          complaints={complaints.slice(0, 8)}
          basePath="/user/complaints"
          emptyLabel="You haven't submitted any complaints yet."
        />
      </section>
    </div>
  );
}

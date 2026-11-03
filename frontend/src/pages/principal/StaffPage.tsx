import { ErrorNote, PageHeader, PageLoader } from '../../components/PageHeader';
import { get } from '../../lib/api';
import type { AppUser, Department } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { StaffManager } from './StaffManager';

export function StaffPage() {
  const { data, error, loading, reload } = useAsync(
    () =>
      Promise.all([
        get<{ users: AppUser[] }>('/api/admin/users'),
        get<{ departments: Department[] }>('/api/departments'),
      ]),
    [],
  );

  if (loading && !data) return <PageLoader label="Loading staff…" />;
  if (error) return <ErrorNote message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Principal portal"
        title="Staff management"
        description="Create HOD and Worker accounts. They sign in with the username and password you set here."
      />
      <StaffManager
        users={data?.[0].users ?? []}
        departments={data?.[1].departments ?? []}
        onCreated={reload}
      />
    </div>
  );
}

import { ErrorNote, PageHeader, PageLoader } from '../../components/PageHeader';
import { get } from '../../lib/api';
import { ROLES } from '../../lib/constants';
import type { AppUser, CategoryStaffMap, Department, SlaConfigRow } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { AssignmentEditor, MappingTable, SlaEditor } from './ConfigEditors';

export function ConfigPage() {
  const { data, error, loading, reload } = useAsync(
    () =>
      Promise.all([
        get<{ sla: SlaConfigRow[] }>('/api/admin/sla'),
        get<{ staff: AppUser[] }>('/api/staff'),
        get<{ mappings: CategoryStaffMap[] }>('/api/admin/assignments'),
        get<{ departments: Department[] }>('/api/departments'),
      ]),
    [],
  );

  if (loading && !data) return <PageLoader label="Loading configuration…" />;
  if (error) return <ErrorNote message={error} />;

  const sla = data?.[0].sla ?? [];
  const workers = (data?.[1].staff ?? []).filter((s) => s.role === ROLES.TECHNICIAN);
  const mappings = data?.[2].mappings ?? [];
  const departments = data?.[3].departments ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Principal portal"
        title="SLA & configuration"
        description="Set worker and HOD windows per priority, and control which worker receives each category."
      />

      <SlaEditor sla={sla} />

      <AssignmentEditor workers={workers} departments={departments} onSaved={reload} />

      <MappingTable mappings={mappings} workers={workers} departments={departments} />
    </div>
  );
}

import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { CATEGORY_LABELS, ROLES } from '@/lib/constants';
import { SlaEditor, AssignmentEditor } from './ConfigEditors';
import type { CategoryStaffMap } from '@/lib/types';

interface SlaRow {
  priority: string;
  worker_minutes: number;
  hod_minutes: number;
}
interface WorkerRow {
  id: string;
  full_name: string;
  username: string;
}
interface DepartmentRow {
  id: string;
  name: string;
}

export default async function ConfigPage() {
  await requireRole([ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);
  const supabase = db();

  const [{ data: sla }, { data: workers }, { data: mappings }, { data: departments }] =
    await Promise.all([
      supabase.from('sla_config').select('*').order('priority'),
      supabase.from('app_users').select('id, full_name, username').eq('role', ROLES.TECHNICIAN),
      supabase.from('category_staff_map').select('*'),
      supabase.from('departments').select('id, name').order('name'),
    ]);

  const staffMap = (mappings ?? []) as CategoryStaffMap[];
  const workerRows = (workers ?? []) as WorkerRow[];
  const deptRows = (departments ?? []) as DepartmentRow[];
  const staffName = new Map(workerRows.map((w) => [w.id, w.full_name || w.username]));
  const deptName = new Map(deptRows.map((d) => [d.id, d.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">SLA &amp; Configuration</h1>
        <p className="text-sm text-slate-500">
          Set how long a worker has before a complaint escalates to the HOD, and how long
          the HOD has before it escalates to you.
        </p>
      </div>

      <SlaEditor sla={(sla ?? []) as SlaRow[]} />

      <AssignmentEditor workers={workerRows} departments={deptRows} />

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Current category → worker mappings</h2>
        <p className="mb-3 text-xs text-slate-500">
          A department-specific mapping takes priority over the global one for complaints filed
          under that department.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Category</th>
                <th className="py-2">Assigned worker</th>
                <th className="py-2">Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffMap.length === 0 ? (
                <tr><td colSpan={3} className="py-4 text-slate-400">No mappings configured.</td></tr>
              ) : (
                staffMap.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 text-slate-700">{CATEGORY_LABELS[m.category]}</td>
                    <td className="py-2 text-slate-700">{staffName.get(m.staff_id) ?? m.staff_id}</td>
                    <td className="py-2 text-slate-500">
                      {m.department_id ? (deptName.get(m.department_id) ?? 'Department') : 'Global'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

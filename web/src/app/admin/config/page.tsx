import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { CATEGORY_LABELS, ROLES } from '@/lib/constants';
import {
  AssignmentEditor,
  SlaEditor,
  UserEditor,
} from './ConfigEditors';
import type {
  CategoryStaffMap,
  Department,
  Profile,
  SlaConfig,
} from '@/lib/types';

export default async function ConfigPage() {
  // Configuration is SUPER_ADMIN only. Principal is redirected by requireRole.
  await requireRole([ROLES.SUPER_ADMIN]);
  const supabase = createClient();

  const [
    { data: sla },
    { data: users },
    { data: departments },
    { data: mappings },
  ] = await Promise.all([
    supabase.from('sla_config').select('*'),
    supabase.from('profiles').select('id, full_name, email, role').order('role'),
    supabase.from('departments').select('*').order('name'),
    supabase.from('category_staff_map').select('*'),
  ]);

  const allUsers = (users ?? []) as Pick<
    Profile,
    'id' | 'full_name' | 'email' | 'role'
  >[];
  const technicians = allUsers.filter((u) => u.role === ROLES.TECHNICIAN);
  const staffMap = (mappings ?? []) as CategoryStaffMap[];
  const staffName = new Map(allUsers.map((u) => [u.id, u.full_name || u.email]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Configuration</h1>
        <p className="text-sm text-slate-500">
          SLA rules, assignment mapping, and user roles.
        </p>
      </div>

      <SlaEditor sla={(sla ?? []) as SlaConfig[]} />

      <AssignmentEditor technicians={technicians} />

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Current category mappings
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Category</th>
                <th className="py-2">Assigned staff</th>
                <th className="py-2">Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffMap.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-slate-400">
                    No mappings configured.
                  </td>
                </tr>
              ) : (
                staffMap.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 text-slate-700">
                      {CATEGORY_LABELS[m.category]}
                    </td>
                    <td className="py-2 text-slate-700">
                      {staffName.get(m.staff_id) ?? m.staff_id}
                    </td>
                    <td className="py-2 text-slate-500">
                      {m.department_id ? 'Department' : 'Global'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserEditor users={allUsers} departments={(departments ?? []) as Department[]} />
    </div>
  );
}

import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { StaffManager } from './StaffManager';
import type { Department } from '@/lib/types';

interface StaffRow {
  id: string;
  username: string;
  full_name: string;
  role: string;
  department_id: string | null;
}

export default async function StaffPage() {
  await requireRole([ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);
  const supabase = db();
  const [{ data: users }, { data: departments }] = await Promise.all([
    supabase.from('app_users').select('id, username, full_name, role, department_id').order('role'),
    supabase.from('departments').select('*').order('name'),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Staff management</h1>
        <p className="text-sm text-slate-500">
          Create HOD and Worker accounts. They sign in with the username &amp; password you set here.
        </p>
      </div>
      <StaffManager
        users={(users ?? []) as StaffRow[]}
        departments={(departments ?? []) as Department[]}
      />
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { NewComplaintForm } from './NewComplaintForm';
import type { Department } from '@/lib/types';

export default async function NewComplaintPage() {
  const profile = await requireRole([ROLES.STUDENT, ROLES.FACULTY]);
  const supabase = createClient();
  const { data: departments } = await supabase
    .from('departments')
    .select('*')
    .order('name');

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">New complaint</h1>
        <p className="text-sm text-slate-500">
          Describe the issue clearly. It will be classified and routed automatically.
        </p>
      </div>
      <NewComplaintForm
        departments={(departments ?? []) as Department[]}
        defaultDepartmentId={profile.department_id}
      />
    </div>
  );
}

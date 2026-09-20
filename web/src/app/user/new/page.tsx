import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { NewComplaintForm } from './NewComplaintForm';
import type { Department } from '@/lib/types';

export default async function NewComplaintPage() {
  const user = await requireRole([ROLES.STUDENT, ROLES.FACULTY]);
  const { data: departments } = await db().from('departments').select('*').order('name');

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">New complaint</h1>
        <p className="text-sm text-slate-500">
          Describe the issue clearly. It will be classified and routed to a worker automatically.
        </p>
      </div>
      <NewComplaintForm
        departments={(departments ?? []) as Department[]}
        defaultDepartmentId={user.department_id}
      />
    </div>
  );
}

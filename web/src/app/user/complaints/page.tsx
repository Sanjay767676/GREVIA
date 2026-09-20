import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { ComplaintTable } from '@/components/ComplaintTable';
import type { Complaint } from '@/lib/types';

export default async function MyComplaints() {
  const user = await requireRole([ROLES.STUDENT, ROLES.FACULTY]);
  const { data } = await db()
    .from('complaints')
    .select('*')
    .eq('created_by', user.sub)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">My complaints</h1>
      <ComplaintTable
        complaints={(data ?? []) as Complaint[]}
        basePath="/user/complaints"
        emptyLabel="You haven't submitted any complaints yet."
      />
    </div>
  );
}

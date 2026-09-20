import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { loadComplaintDetail } from '@/lib/complaint-detail';
import { ComplaintDetail } from '@/components/ComplaintDetail';
import { HodActions } from './HodActions';

export default async function HodComplaintDetail({ params }: { params: { id: string } }) {
  const user = await requireRole([ROLES.HOD]);
  const { complaint, history, imageUrl, proofUrl } = await loadComplaintDetail(params.id, user);

  const { data: techs } = await db()
    .from('app_users')
    .select('id, full_name, username')
    .eq('role', ROLES.TECHNICIAN);

  return (
    <ComplaintDetail
      complaint={complaint}
      history={history}
      imageUrl={imageUrl}
      proofUrl={proofUrl}
      actions={
        <HodActions
          complaintId={complaint.id}
          technicians={(techs ?? []) as { id: string; full_name: string; username: string }[]}
        />
      }
    />
  );
}

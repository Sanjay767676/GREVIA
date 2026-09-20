import { requireRole } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { loadComplaintDetail } from '@/lib/complaint-detail';
import { ComplaintDetail } from '@/components/ComplaintDetail';
import { AdminActions } from './AdminActions';

export default async function PrincipalComplaintDetail({ params }: { params: { id: string } }) {
  const user = await requireRole([ROLES.PRINCIPAL, ROLES.SUPER_ADMIN]);
  const { complaint, history, imageUrl, proofUrl } = await loadComplaintDetail(params.id, user);

  return (
    <ComplaintDetail
      complaint={complaint}
      history={history}
      imageUrl={imageUrl}
      proofUrl={proofUrl}
      actions={<AdminActions complaintId={complaint.id} />}
    />
  );
}

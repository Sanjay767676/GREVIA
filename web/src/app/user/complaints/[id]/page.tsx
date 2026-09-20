import { requireRole } from '@/lib/auth';
import { ROLES, STATUS } from '@/lib/constants';
import { loadComplaintDetail } from '@/lib/complaint-detail';
import { ComplaintDetail } from '@/components/ComplaintDetail';
import { VerifyActions } from './VerifyActions';

export default async function UserComplaintDetail({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireRole([ROLES.STUDENT, ROLES.FACULTY]);
  const { complaint, history, imageUrl, proofUrl } = await loadComplaintDetail(
    params.id,
  );

  const canVerify =
    complaint.created_by === profile.id &&
    complaint.status === STATUS.USER_VERIFICATION;

  return (
    <ComplaintDetail
      complaint={complaint}
      history={history}
      imageUrl={imageUrl}
      proofUrl={proofUrl}
      actions={canVerify ? <VerifyActions complaintId={complaint.id} /> : null}
    />
  );
}

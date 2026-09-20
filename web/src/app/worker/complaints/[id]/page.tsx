import { requireRole } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { loadComplaintDetail } from '@/lib/complaint-detail';
import { ComplaintDetail } from '@/components/ComplaintDetail';
import { WorkerActions } from './WorkerActions';

export default async function WorkerComplaintDetail({ params }: { params: { id: string } }) {
  const user = await requireRole([ROLES.TECHNICIAN]);
  const { complaint, history, imageUrl, proofUrl } = await loadComplaintDetail(params.id, user);
  const isAssigned = complaint.assigned_to === user.sub;

  return (
    <ComplaintDetail
      complaint={complaint}
      history={history}
      imageUrl={imageUrl}
      proofUrl={proofUrl}
      actions={
        isAssigned ? (
          <WorkerActions complaintId={complaint.id} status={complaint.status} />
        ) : (
          <p className="text-sm text-slate-500">This complaint is not assigned to you.</p>
        )
      }
    />
  );
}

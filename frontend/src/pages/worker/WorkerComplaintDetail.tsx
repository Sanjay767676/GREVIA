import { useParams } from 'react-router-dom';
import { ComplaintDetail } from '../../components/ComplaintDetail';
import { ErrorNote, PageLoader } from '../../components/PageHeader';
import { get } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { ComplaintDetailResponse } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { WorkerActions } from './WorkerActions';

export function WorkerComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(
    () => get<ComplaintDetailResponse>(`/api/complaints/${id}`),
    [id],
  );

  if (loading && !data) return <PageLoader label="Loading complaint…" />;
  if (error) return <ErrorNote message={error} />;
  if (!data) return <ErrorNote message="Complaint not found." />;

  const { complaint, history, imageUrl, proofUrl } = data;
  const isAssigned = complaint.assigned_to === user?.sub;

  return (
    <ComplaintDetail
      complaint={complaint}
      history={history}
      imageUrl={imageUrl}
      proofUrl={proofUrl}
      actions={
        isAssigned ? (
          <WorkerActions complaintId={complaint.id} status={complaint.status} onDone={reload} />
        ) : (
          <p className="text-sm text-stone-500">This complaint is not assigned to you.</p>
        )
      }
    />
  );
}

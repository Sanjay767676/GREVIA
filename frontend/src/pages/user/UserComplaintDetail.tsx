import { useParams } from 'react-router-dom';
import { ComplaintDetail } from '../../components/ComplaintDetail';
import { ErrorNote, PageLoader } from '../../components/PageHeader';
import { get } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { STATUS } from '../../lib/constants';
import type { ComplaintDetailResponse } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { VerifyActions } from './VerifyActions';

export function UserComplaintDetail() {
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
  const canVerify = complaint.created_by === user?.sub && complaint.status === STATUS.RESOLVED;

  return (
    <ComplaintDetail
      complaint={complaint}
      history={history}
      imageUrl={imageUrl}
      proofUrl={proofUrl}
      actions={canVerify ? <VerifyActions complaintId={complaint.id} onDone={reload} /> : null}
    />
  );
}

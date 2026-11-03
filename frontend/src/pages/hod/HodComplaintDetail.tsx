import { useParams } from 'react-router-dom';
import { ComplaintDetail } from '../../components/ComplaintDetail';
import { ErrorNote, PageLoader } from '../../components/PageHeader';
import { get } from '../../lib/api';
import type { ComplaintDetailResponse } from '../../lib/types';
import { useAsync } from '../../lib/useAsync';
import { HodActions } from './HodActions';

export function HodComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload } = useAsync(
    () => get<ComplaintDetailResponse>(`/api/complaints/${id}`),
    [id],
  );

  if (loading && !data) return <PageLoader label="Loading complaint…" />;
  if (error) return <ErrorNote message={error} />;
  if (!data) return <ErrorNote message="Complaint not found." />;

  return (
    <ComplaintDetail
      complaint={data.complaint}
      history={data.history}
      imageUrl={data.imageUrl}
      proofUrl={data.proofUrl}
      actions={<HodActions complaintId={data.complaint.id} onDone={reload} />}
    />
  );
}

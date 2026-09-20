import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { loadComplaintDetail } from '@/lib/complaint-detail';
import { ComplaintDetail } from '@/components/ComplaintDetail';
import { HodActions } from './HodActions';
import type { Profile } from '@/lib/types';

export default async function HodComplaintDetail({
  params,
}: {
  params: { id: string };
}) {
  await requireRole([ROLES.HOD]);
  const { complaint, history, imageUrl, proofUrl } = await loadComplaintDetail(
    params.id,
  );

  // Technicians available for reassignment.
  const supabase = createClient();
  const { data: techs } = await supabase
    .from('profiles')
    .select('id, full_name, email')
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
          technicians={(techs ?? []) as Pick<Profile, 'id' | 'full_name' | 'email'>[]}
        />
      }
    />
  );
}

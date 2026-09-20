import { notFound } from 'next/navigation';
import { db } from './db';
import { publicEnv } from './env';
import { ROLES } from './constants';
import type { Complaint, ComplaintHistory } from './types';
import type { SessionPayload } from './session';

function canView(user: SessionPayload, c: Complaint): boolean {
  if (c.created_by === user.sub) return true;
  if (c.assigned_to === user.sub) return true;
  if (user.role === ROLES.PRINCIPAL || user.role === ROLES.SUPER_ADMIN) return true;
  if (user.role === ROLES.HOD && c.department_id === user.department_id) return true;
  return false;
}

// Server-side loader for complaint detail pages. Enforces visibility by role.
export async function loadComplaintDetail(
  id: string,
  user: SessionPayload,
): Promise<{
  complaint: Complaint;
  history: ComplaintHistory[];
  imageUrl: string | null;
  proofUrl: string | null;
}> {
  const supabase = db();

  const { data: complaint } = await supabase
    .from('complaints')
    .select('*')
    .eq('id', id)
    .single<Complaint>();
  if (!complaint) notFound();
  if (!canView(user, complaint)) notFound();

  const { data: history } = await supabase
    .from('complaint_history')
    .select('*')
    .eq('complaint_id', id)
    .order('created_at', { ascending: true });

  const imageUrl = await signed(complaint.image_path);
  const proofUrl = await signed(complaint.resolution_proof_path);

  return {
    complaint,
    history: (history ?? []) as ComplaintHistory[],
    imageUrl,
    proofUrl,
  };
}

async function signed(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await db()
    .storage.from(publicEnv.storageBucket)
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

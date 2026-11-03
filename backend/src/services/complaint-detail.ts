import type { SupabaseClient } from '@supabase/supabase-js';
import { ROLES } from '../domain/constants.js';
import type { Complaint, ComplaintHistory, SessionPayload } from '../domain/types.js';
import { env } from '../config/env.js';

export function canViewComplaint(user: SessionPayload, c: Complaint): boolean {
  if (c.created_by === user.sub) return true;
  if (c.assigned_to === user.sub) return true;
  if (user.role === ROLES.PRINCIPAL || user.role === ROLES.SUPER_ADMIN) return true;
  if (user.role === ROLES.HOD && c.department_id === user.department_id) return true;
  return false;
}

export interface ComplaintDetail {
  complaint: Complaint;
  history: ComplaintHistory[];
  imageUrl: string | null;
  proofUrl: string | null;
}

export async function loadComplaintDetail(
  supabase: SupabaseClient,
  id: string,
  user: SessionPayload,
): Promise<ComplaintDetail | null> {
  const { data: complaint } = await supabase
    .from('complaints')
    .select('*')
    .eq('id', id)
    .single<Complaint>();
  if (!complaint) return null;
  if (!canViewComplaint(user, complaint)) return null;

  const { data: history } = await supabase
    .from('complaint_history')
    .select('*')
    .eq('complaint_id', id)
    .order('created_at', { ascending: true });

  const [imageUrl, proofUrl] = await Promise.all([
    signedUrl(supabase, complaint.image_path),
    signedUrl(supabase, complaint.resolution_proof_path),
  ]);

  return {
    complaint,
    history: (history ?? []) as ComplaintHistory[],
    imageUrl,
    proofUrl,
  };
}

async function signedUrl(supabase: SupabaseClient, path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(env.storageBucket).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

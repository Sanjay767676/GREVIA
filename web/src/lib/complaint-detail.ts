import { notFound } from 'next/navigation';
import { createClient } from './supabase/server';
import { publicEnv } from './env';
import type { Complaint, ComplaintHistory } from './types';

// Server-side loader shared by all portal detail pages. Enforces RLS via the
// user's session client and resolves signed URLs for image/proof.
export async function loadComplaintDetail(id: string): Promise<{
  complaint: Complaint;
  history: ComplaintHistory[];
  imageUrl: string | null;
  proofUrl: string | null;
}> {
  const supabase = createClient();

  const { data: complaint } = await supabase
    .from('complaints')
    .select('*')
    .eq('id', id)
    .single<Complaint>();
  if (!complaint) notFound();

  const { data: history } = await supabase
    .from('complaint_history')
    .select('*')
    .eq('complaint_id', id)
    .order('created_at', { ascending: true });

  const imageUrl = await signed(supabase, complaint.image_path);
  const proofUrl = await signed(supabase, complaint.resolution_proof_path);

  return {
    complaint,
    history: (history ?? []) as ComplaintHistory[],
    imageUrl,
    proofUrl,
  };
}

async function signed(
  supabase: ReturnType<typeof createClient>,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage
    .from(publicEnv.storageBucket)
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

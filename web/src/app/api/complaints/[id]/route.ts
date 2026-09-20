import { NextResponse } from 'next/server';
import { ApiError, errorResponse, getApiProfile } from '@/lib/api-auth';
import { createClient } from '@/lib/supabase/server';

// GET /api/complaints/:id — detail + timeline (RLS-scoped).
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await getApiProfile();
    const supabase = createClient();

    const { data: complaint, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', params.id)
      .single();
    if (error || !complaint) throw new ApiError(404, 'Complaint not found');

    const { data: history } = await supabase
      .from('complaint_history')
      .select('*')
      .eq('complaint_id', params.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ complaint, history: history ?? [] });
  } catch (err) {
    return errorResponse(err);
  }
}

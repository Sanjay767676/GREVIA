import { NextResponse } from 'next/server';
import { ApiError, errorResponse, requireApiUser } from '@/lib/api-auth';
import { db } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireApiUser();
    const { data: complaint, error } = await db()
      .from('complaints')
      .select('*')
      .eq('id', params.id)
      .single();
    if (error || !complaint) throw new ApiError(404, 'Complaint not found');

    const { data: history } = await db()
      .from('complaint_history')
      .select('*')
      .eq('complaint_id', params.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ complaint, history: history ?? [] });
  } catch (err) {
    return errorResponse(err);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { ApiError, errorResponse, getApiProfile } from '@/lib/api-auth';
import { createClient } from '@/lib/supabase/server';

// GET /api/notifications — current user's notifications (newest first).
export async function GET() {
  try {
    await getApiProfile();
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw new ApiError(500, error.message);
    const unread = (data ?? []).filter((n) => !n.read).length;
    return NextResponse.json({ notifications: data ?? [], unread });
  } catch (err) {
    return errorResponse(err);
  }
}

// PATCH /api/notifications — mark all (or one) as read.
// body: { id?: string }  (omit id to mark all)
export async function PATCH(req: NextRequest) {
  try {
    const profile = await getApiProfile();
    const supabase = createClient();
    const body = await req.json().catch(() => ({}));

    let query = supabase.from('notifications').update({ read: true }).eq('user_id', profile.id);
    if (body.id) query = query.eq('id', String(body.id));
    const { error } = await query;
    if (error) throw new ApiError(500, error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { ApiError, errorResponse, requireApiUser } from '@/lib/api-auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireApiUser();
    const { data, error } = await db()
      .from('notifications')
      .select('*')
      .eq('user_id', user.sub)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw new ApiError(500, error.message);
    const unread = (data ?? []).filter((n) => !n.read).length;
    return NextResponse.json({ notifications: data ?? [], unread });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireApiUser();
    const body = await req.json().catch(() => ({}));
    let query = db().from('notifications').update({ read: true }).eq('user_id', user.sub);
    if (body.id) query = query.eq('id', String(body.id));
    const { error } = await query;
    if (error) throw new ApiError(500, error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

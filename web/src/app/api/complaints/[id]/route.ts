import { NextResponse } from 'next/server';
import { ApiError, errorResponse, requireApiUser } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { ROLES } from '@/lib/constants';
import type { Complaint } from '@/lib/types';

// Same visibility rules as the server-side page loader (lib/complaint-detail):
// owner and assignee always, HOD for own department, principal/super admin all.
function canView(user: { sub: string; role: string; department_id: string | null }, c: Complaint): boolean {
  if (c.created_by === user.sub) return true;
  if (c.assigned_to === user.sub) return true;
  if (user.role === ROLES.PRINCIPAL || user.role === ROLES.SUPER_ADMIN) return true;
  if (user.role === ROLES.HOD && c.department_id === user.department_id) return true;
  return false;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireApiUser();
    const { data: complaint, error } = await db()
      .from('complaints')
      .select('*')
      .eq('id', params.id)
      .single();
    if (error || !complaint) throw new ApiError(404, 'Complaint not found');
    if (!canView(user, complaint)) throw new ApiError(404, 'Complaint not found');

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

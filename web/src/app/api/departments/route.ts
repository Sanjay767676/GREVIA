import { NextResponse } from 'next/server';
import { errorResponse, requireApiUser } from '@/lib/api-auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    await requireApiUser();
    const { data, error } = await db().from('departments').select('*').order('name');
    if (error) throw error;
    return NextResponse.json({ departments: data ?? [] });
  } catch (err) {
    return errorResponse(err);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { ApiError, errorResponse, requireApiUser } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { publicEnv } from '@/lib/env';

// POST /api/upload — multipart file upload to Supabase Storage (service role).
// Returns the stored object path. Used for complaint images + resolution proof.
export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser();
    const form = await req.formData();
    const file = form.get('file');
    const prefix = String(form.get('prefix') ?? 'upload');
    if (!(file instanceof File)) throw new ApiError(422, 'No file provided');

    const ext = file.name.split('.').pop() || 'bin';
    const path = `${user.sub}/${prefix}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await db()
      .storage.from(publicEnv.storageBucket)
      .upload(path, buffer, { contentType: file.type || 'application/octet-stream', upsert: false });
    if (error) throw new ApiError(500, `Upload failed: ${error.message}`);

    return NextResponse.json({ path });
  } catch (err) {
    return errorResponse(err);
  }
}

import { NextResponse } from 'next/server';
import { createClient } from './supabase/server';
import type { Role } from './constants';
import type { Profile } from './types';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Resolve the authenticated caller's profile inside a route handler.
// Throws ApiError(401) if unauthenticated.
export async function getApiProfile(): Promise<Profile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new ApiError(401, 'Not authenticated');

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!data) throw new ApiError(401, 'Profile not found');
  return data as Profile;
}

export function requireApiRole(profile: Profile, allowed: Role[]): void {
  if (!allowed.includes(profile.role)) {
    throw new ApiError(403, 'Insufficient permissions');
  }
}

// Convert thrown errors into a JSON response. Wrap handler bodies with this.
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : 'Internal server error';
  return NextResponse.json({ error: message }, { status: 500 });
}

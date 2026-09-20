import { NextResponse } from 'next/server';
import { getSession, type SessionPayload } from './session';
import type { Role } from './constants';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Resolve the authenticated caller from the session cookie. Throws 401 if absent.
export async function requireApiUser(): Promise<SessionPayload> {
  const user = await getSession();
  if (!user) throw new ApiError(401, 'Not authenticated');
  return user;
}

export function requireApiRole(user: SessionPayload, allowed: Role[]): void {
  if (!allowed.includes(user.role)) {
    throw new ApiError(403, 'Insufficient permissions');
  }
}

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : 'Internal server error';
  return NextResponse.json({ error: message }, { status: 500 });
}

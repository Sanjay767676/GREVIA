import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { Role } from './constants';

const COOKIE_NAME = 'grievia_session';
const MAX_AGE = 60 * 60 * 8; // 8 hours

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET || 'dev-insecure-secret-change-me';
  return new TextEncoder().encode(s);
}

export interface SessionPayload {
  sub: string; // app_users.id
  username: string;
  role: Role;
  full_name: string;
  department_id: string | null;
}

// Sign a session token and set it as an httpOnly cookie.
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

// Read + verify the current session (server-side). Returns null if absent/invalid.
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  cookies().set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
}

export const SESSION_COOKIE = COOKIE_NAME;

// Verify a token string (used by middleware where cookies() isn't available
// in the same way). Returns payload or null.
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

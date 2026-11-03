import type { Request, Response } from 'express';
import { SignJWT, jwtVerify } from 'jose';
import { env, isProd } from '../config/env.js';
import type { SessionPayload } from '../domain/types.js';

export const SESSION_COOKIE = 'grievia_session';
const MAX_AGE = 60 * 60 * 8; // 8 hours

function secret(): Uint8Array {
  return new TextEncoder().encode(env.sessionSecret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
    maxAge: MAX_AGE * 1000,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
  });
}

// Accept the httpOnly cookie (primary) or an Authorization bearer token.
export async function readSession(req: Request): Promise<SessionPayload | null> {
  const bearer = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  const token = req.cookies?.[SESSION_COOKIE] ?? (bearer || null);
  if (!token) return null;
  return verifySession(token);
}

export const sessionCookieOptions = {
  maxAgeMs: MAX_AGE * 1000,
  isProd,
};

import { redirect } from 'next/navigation';
import { getSession } from './session';
import { ROLE_PORTAL, type Role } from './constants';
import type { SessionPayload } from './session';

// Current session (server-side). Null if not logged in.
export async function currentUser(): Promise<SessionPayload | null> {
  return getSession();
}

export async function requireUser(): Promise<SessionPayload> {
  const user = await getSession();
  if (!user) redirect('/login');
  return user;
}

// Require one of the allowed roles; otherwise bounce to the user's own portal.
export async function requireRole(allowed: Role[]): Promise<SessionPayload> {
  const user = await requireUser();
  if (!allowed.includes(user.role)) {
    redirect(ROLE_PORTAL[user.role] ?? '/login');
  }
  return user;
}

export function portalForRole(role: Role): string {
  return ROLE_PORTAL[role] ?? '/login';
}

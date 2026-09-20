import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import { ROLE_PORTAL, type Role } from './constants';
import type { Profile } from './types';

// Fetch the current authenticated user's profile (server-side). Returns null
// if unauthenticated or profile missing.
export async function getSessionProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (data as Profile) ?? null;
}

// Require authentication; redirect to /login if absent.
export async function requireProfile(): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile) redirect('/login');
  return profile;
}

// Require one of the allowed roles; otherwise bounce to the user's own portal
// (or /login if unauthenticated). Used at the top of each portal layout.
export async function requireRole(allowed: Role[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!allowed.includes(profile.role)) {
    redirect(ROLE_PORTAL[profile.role] ?? '/login');
  }
  return profile;
}

export function portalForRole(role: Role): string {
  return ROLE_PORTAL[role] ?? '/login';
}

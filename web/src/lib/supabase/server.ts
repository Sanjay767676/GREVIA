import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { publicEnv } from '../env';

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Server-side Supabase client bound to the request cookies. Respects RLS as
// the authenticated user. Use in Server Components and route handlers.
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component where cookies are read-only.
            // Session refresh is handled by middleware, so ignore.
          }
        },
      },
    },
  );
}

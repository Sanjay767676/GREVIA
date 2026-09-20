// ---------------------------------------------------------------------------
// Centralized environment access. Server-only secrets are read lazily so the
// browser bundle never trips over missing service keys. Public vars are
// inlined by Next at build time via the NEXT_PUBLIC_ prefix.
// ---------------------------------------------------------------------------

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  storageBucket:
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'complaints',
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
};

export function getServerEnv() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    cronSecret: process.env.CRON_SECRET ?? '',
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
  };
}



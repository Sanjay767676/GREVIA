import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getServerEnv } from '../env';

// Service-role client that BYPASSES RLS. SERVER ONLY. Use exclusively inside
// route handlers / background jobs for privileged, deterministic operations
// (assignment, escalation, audit, notifications). Never import in client code.
export function createAdminClient() {
  const env = getServerEnv();
  if (!env.supabaseUrl || !env.serviceRoleKey) {
    throw new Error(
      'Service role client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }
  return createSupabaseClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

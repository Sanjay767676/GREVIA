import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Service-role client that bypasses RLS. Server only. All authorization is
// enforced by the Express layer before touching the database.
let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (client) return client;
  if (!env.supabaseUrl || !env.serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  }
  client = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}

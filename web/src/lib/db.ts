import { createAdminClient } from './supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

// Singleton service-role client for all server-side data access.
let client: SupabaseClient | null = null;
export function db(): SupabaseClient {
  if (!client) client = createAdminClient();
  return client;
}

'use client';

import { createBrowserClient } from '@supabase/ssr';
import { publicEnv } from '../env';

// Browser-side Supabase client (respects RLS via the user's session cookie).
export function createClient() {
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
}

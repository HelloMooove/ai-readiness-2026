'use client';

import { createBrowserClient } from '@supabase/ssr';
import { readSupabaseEnv } from './env';

// Browser-side Supabase client. Returns null when env vars are missing so
// the UI can show a friendly "not configured yet" message instead of
// throwing at module load.
export function createBrowserSupabase() {
  const env = readSupabaseEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.anonKey);
}

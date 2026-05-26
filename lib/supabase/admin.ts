import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Server-only Supabase client using the service role key. Bypasses RLS so
// the form-handling routes can write submissions on behalf of anonymous
// public visitors. Never import this from client-side code.

let cached: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  if (cached) return cached;
  cached = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
}

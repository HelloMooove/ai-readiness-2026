import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireSupabaseEnv } from './env';

// Server-side Supabase client for use in Server Components, Route Handlers,
// and Server Actions. Cookie writes are wrapped in try/catch because Server
// Components are not allowed to mutate cookies; the no-op there is fine since
// middleware refreshes the session on every request.
export async function createServerSupabase() {
  const { url, anonKey } = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component context — cookie mutation not allowed. Safe to ignore.
        }
      },
    },
  });
}

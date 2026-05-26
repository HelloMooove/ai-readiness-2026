import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { isAllowed } from '@/lib/auth/allowlist';
import { readSupabaseEnv } from '@/lib/supabase/env';

// Helper used by every admin page to enforce auth + allowlist. Returns the
// authenticated user's email when access is allowed. When Supabase isn't
// configured, returns null — pages can detect this and render a setup
// screen instead of trying to load data.
export async function requireAdmin(): Promise<{ email: string } | null> {
  const env = readSupabaseEnv();
  if (!env) return null;

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');
  if (!isAllowed(user.email)) redirect('/admin/login?error=not_allowed');

  return { email: user.email! };
}

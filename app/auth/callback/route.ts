import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { readSupabaseEnv } from '@/lib/supabase/env';
import { isAllowed } from '@/lib/auth/allowlist';

// Magic-link callback. Supabase redirects the user here with `?code=...`.
// We exchange the code for a session, enforce the email allowlist, and
// redirect to /admin (or the `next` param if provided).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/admin';

  if (!code) {
    return NextResponse.redirect(
      `${origin}/admin/login?error=${encodeURIComponent('Missing auth code')}`,
    );
  }

  const env = readSupabaseEnv();
  if (!env) {
    return NextResponse.redirect(
      `${origin}/admin/login?error=${encodeURIComponent('Supabase not configured')}`,
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/admin/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  const email = data?.session?.user?.email;
  if (!isAllowed(email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/admin/login?error=${encodeURIComponent(
        'This email is not authorized for admin access.',
      )}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}

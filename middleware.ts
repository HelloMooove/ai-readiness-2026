import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { readSupabaseEnv } from './lib/supabase/env';

// Auth middleware:
//   - Refreshes the Supabase session cookie on every matched request.
//   - Redirects unauthenticated /admin/* requests to /admin/login.
//   - Bounces already-authenticated users away from /admin/login.
//
// If Supabase env vars are missing the middleware no-ops so the public form
// keeps working and the /admin pages can render their own "setup needed"
// guidance instead of throwing.
export async function middleware(request: NextRequest) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.next();

  const response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === '/admin/login';

  if (pathname.startsWith('/admin') && !isLoginPage && !user) {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && user) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return response;
}

export const config = {
  // Match admin pages and the auth callback. Auth-callback runs the
  // exchangeCodeForSession itself so it doesn't strictly need middleware,
  // but matching it here ensures cookies are written consistently.
  matcher: ['/admin/:path*', '/auth/:path*'],
};

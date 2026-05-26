import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { isAllowed, getAllowlist } from '@/lib/auth/allowlist';
import { readSupabaseEnv } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const env = readSupabaseEnv();
  if (!env) {
    return (
      <main className="admin-shell">
        <div className="admin-card">
          <h1>Admin setup needed</h1>
          <p>
            The admin section needs Supabase to be configured before it can run.
            Add the following environment variables to your Vercel project and redeploy:
          </p>
          <pre className="admin-code">
            NEXT_PUBLIC_SUPABASE_URL=https://&lt;your-project&gt;.supabase.co
            {'\n'}NEXT_PUBLIC_SUPABASE_ANON_KEY=&lt;your-anon-key&gt;
          </pre>
          <p className="admin-muted">
            Both values come from your Supabase project: Settings → API.
          </p>
        </div>
      </main>
    );
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');
  if (!isAllowed(user.email)) {
    return (
      <main className="admin-shell">
        <div className="admin-card">
          <h1>Not authorized</h1>
          <p>
            <code>{user.email}</code> is not on the admin allowlist. Sign out and try a
            different email, or ask an existing admin to add you.
          </p>
          <p className="admin-muted">
            Current allowlist: <code>{getAllowlist().join(', ')}</code>
          </p>
          <form action="/auth/signout" method="POST">
            <button type="submit" className="admin-btn">
              Sign out
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-brand">MOOOVE Admin</div>
        <div className="admin-user">
          <span>{user.email}</span>
          <form action="/auth/signout" method="POST">
            <button type="submit" className="admin-btn admin-btn-ghost">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="admin-card">
        <h1>Welcome.</h1>
        <p>
          You&apos;re signed in to the admin. The foundation is live — submissions,
          insights, form builder, and user management land in the next phases.
        </p>
        <ul className="admin-progress">
          <li className="done">Phase 0 — Foundation (Next.js + Supabase auth)</li>
          <li>Phase 1 — Submissions, drafts capture, Excel export, insights</li>
          <li>Phase 2 — Multi-form support + per-form Airtable connections</li>
          <li>Phase 3 — AI form builder (paste text / upload Word doc)</li>
          <li>Phase 4 — User invites + roles</li>
        </ul>
      </section>
    </main>
  );
}

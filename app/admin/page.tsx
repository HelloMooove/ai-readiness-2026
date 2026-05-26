import Link from 'next/link';
import { readSupabaseEnv } from '@/lib/supabase/env';
import { requireAdmin } from './_components/requireAdmin';
import AdminTopbar from './_components/AdminTopbar';
import { createServerSupabase } from '@/lib/supabase/server';

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
            Add these environment variables to Vercel and redeploy:
          </p>
          <pre className="admin-code">
            NEXT_PUBLIC_SUPABASE_URL=https://&lt;your-project&gt;.supabase.co
            {'\n'}NEXT_PUBLIC_SUPABASE_ANON_KEY=&lt;your-anon-key&gt;
          </pre>
        </div>
      </main>
    );
  }

  const session = await requireAdmin();
  if (!session) return null;

  // Quick counts for the dashboard cards
  const supabase = await createServerSupabase();
  const [{ count: allCount }, { count: completedCount }, { count: partialCount }] = await Promise.all([
    supabase.from('submissions').select('*', { count: 'exact', head: true }),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).not('completed_at', 'is', null),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).is('completed_at', null),
  ]);

  return (
    <main className="admin-shell">
      <AdminTopbar email={session.email} current="home" />
      <section className="admin-card">
          <h1>Welcome.</h1>
          <p>Quick overview. Use the nav above to dive in.</p>

          <div className="stat-grid">
            <Link href="/admin/submissions?tab=all" className="stat">
              <span className="stat-label">All submissions</span>
              <span className="stat-value">{allCount ?? 0}</span>
            </Link>
            <Link href="/admin/submissions?tab=completed" className="stat">
              <span className="stat-label">Completed</span>
              <span className="stat-value stat-good">{completedCount ?? 0}</span>
            </Link>
            <Link href="/admin/submissions?tab=partial" className="stat">
              <span className="stat-label">Partial / drop-offs</span>
              <span className="stat-value stat-warn">{partialCount ?? 0}</span>
            </Link>
          </div>

          <ul className="admin-progress">
            <li className="done">Phase 0 — Foundation (Next.js + Supabase auth)</li>
            <li className="done">Phase 1.1 — Draft capture (Supabase mirror live)</li>
            <li className="done">Phase 1.2 — Admin submissions list</li>
            <li>Phase 1.3 — Excel export</li>
            <li>Phase 1.4 — Insights</li>
            <li>Phase 2 — Multi-form support + per-form Airtable connections</li>
            <li>Phase 3 — AI form builder (paste text / upload Word doc)</li>
            <li>Phase 4 — User invites + roles</li>
          </ul>
      </section>
    </main>
  );
}

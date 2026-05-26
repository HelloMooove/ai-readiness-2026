import { requireAdmin } from '../_components/requireAdmin';
import AdminTopbar from '../_components/AdminTopbar';
import { readSupabaseEnv } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
  const env = readSupabaseEnv();
  if (!env) {
    return (
      <main className="admin-shell">
        <div className="admin-card">
          <h1>Admin setup needed</h1>
          <p>Supabase env vars are missing.</p>
        </div>
      </main>
    );
  }

  const session = await requireAdmin();
  if (!session) return null;

  return (
    <main className="admin-shell">
      <AdminTopbar email={session.email} current="insights" />
      <div className="page-header">
        <h1>Insights</h1>
        <p className="admin-muted">Per-question breakdowns and drop-off analytics.</p>
      </div>
      <div className="admin-card">
        <p>Insights land in Stage 1.4. For now you can browse raw responses in <a className="row-link" href="/admin/submissions">Submissions</a>.</p>
      </div>
    </main>
  );
}

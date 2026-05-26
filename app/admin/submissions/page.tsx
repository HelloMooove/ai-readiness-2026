import Link from 'next/link';
import { readSupabaseEnv } from '@/lib/supabase/env';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireAdmin } from '../_components/requireAdmin';
import AdminTopbar from '../_components/AdminTopbar';
import { getQuestion } from '@/lib/form-schemas/ai-readiness-2026';
import type { Submission, SubmissionStatus } from '@/lib/types/submission';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

type SearchParams = {
  tab?: string;
  page?: string;
  q?: string;
};

function parseTab(raw: string | undefined): SubmissionStatus {
  if (raw === 'completed') return 'completed';
  if (raw === 'partial') return 'partial';
  return 'all';
}

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fullName(s: Submission): string {
  const parts = [s.first_name, s.last_name].filter(Boolean) as string[];
  return parts.join(' ') || '—';
}

function lastStepLabel(s: Submission): string {
  if (s.completed_at) return 'Completed';
  if (s.last_question_id === 'contact') return 'Contact form';
  if (s.last_question_id) {
    const q = getQuestion(s.last_question_id);
    if (q) return `${s.last_question_id.toUpperCase()} — ${q.text}`;
    return s.last_question_id;
  }
  return '—';
}

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const env = readSupabaseEnv();
  if (!env) return <SetupNeeded />;

  const session = await requireAdmin();
  if (!session) return null;

  const params = await searchParams;
  const tab = parseTab(params.tab);
  const page = parsePage(params.page);
  const search = (params.q || '').trim();

  const supabase = await createServerSupabase();

  // Counts for the tabs (always show all three)
  const [{ count: allCount }, { count: completedCount }, { count: partialCount }] = await Promise.all([
    supabase.from('submissions').select('*', { count: 'exact', head: true }),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).not('completed_at', 'is', null),
    supabase.from('submissions').select('*', { count: 'exact', head: true }).is('completed_at', null),
  ]);

  // Main list query
  let query = supabase
    .from('submissions')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (tab === 'completed') query = query.not('completed_at', 'is', null);
  else if (tab === 'partial') query = query.is('completed_at', null);

  if (search) {
    // Strip characters that would break PostgREST's .or() filter syntax
    // (comma is the separator; parens/asterisks have special meaning).
    const safe = search.replace(/[,()*]/g, '').slice(0, 100);
    if (safe) {
      query = query.or(
        `email.ilike.%${safe}%,first_name.ilike.%${safe}%,last_name.ilike.%${safe}%`,
      );
    }
  }

  const { data: rows, count: pageCount, error } = await query;

  const submissions = (rows ?? []) as Submission[];
  const total = pageCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="admin-shell">
      <AdminTopbar email={session.email} current="submissions" />
      <div className="page-header">
          <h1>Submissions</h1>
          <p className="admin-muted">Browse every submission — completed and partial.</p>
        </div>

        <div className="admin-card admin-card-flush">
          <div className="tab-row" role="tablist">
            <TabLink tab="all"       label="All"       count={allCount ?? 0}       activeTab={tab} search={search} />
            <TabLink tab="completed" label="Completed" count={completedCount ?? 0} activeTab={tab} search={search} />
            <TabLink tab="partial"   label="Partial"   count={partialCount ?? 0}   activeTab={tab} search={search} />
          </div>

          <form className="search-row" action="/admin/submissions" method="GET">
            <input type="hidden" name="tab" value={tab} />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Search by email or name…"
              className="search-input"
              aria-label="Search submissions"
            />
            <button type="submit" className="admin-btn">Search</button>
            {search && (
              <Link href={`/admin/submissions?tab=${tab}`} className="admin-btn admin-btn-ghost">
                Clear
              </Link>
            )}
          </form>

          {error && (
            <div className="admin-error-banner">
              Failed to load submissions: {error.message}
            </div>
          )}

          {submissions.length === 0 ? (
            <div className="empty-state">
              {search
                ? `No submissions match "${search}".`
                : tab === 'partial'
                  ? 'No partial submissions yet.'
                  : tab === 'completed'
                    ? 'No completed submissions yet.'
                    : 'No submissions yet. Submit the form to test.'}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Last activity</th>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Score</th>
                    <th>Tier</th>
                    <th>Answered</th>
                    <th>Last seen on</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.id}>
                      <td>
                        {s.completed_at ? (
                          <span className="badge badge-good">✓ Completed</span>
                        ) : (
                          <span className="badge badge-warn">◷ Partial</span>
                        )}
                      </td>
                      <td>
                        <Link href={`/admin/submissions/${s.id}`} className="row-link">
                          {fmtDate(s.updated_at)}
                        </Link>
                      </td>
                      <td>{s.email ?? '—'}</td>
                      <td>{fullName(s)}</td>
                      <td>{s.score ?? '—'}</td>
                      <td>{s.tier ?? '—'}</td>
                      <td>{s.question_count}</td>
                      <td className="cell-truncate" title={lastStepLabel(s)}>
                        {lastStepLabel(s)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <PageLink page={page - 1} disabled={page <= 1} tab={tab} search={search} label="← Previous" />
              <span className="page-info">
                Page {page} of {totalPages} · {total} total
              </span>
              <PageLink page={page + 1} disabled={page >= totalPages} tab={tab} search={search} label="Next →" />
            </div>
          )}
      </div>
    </main>
  );
}

function TabLink({
  tab, label, count, activeTab, search,
}: {
  tab: SubmissionStatus;
  label: string;
  count: number;
  activeTab: SubmissionStatus;
  search: string;
}) {
  const params = new URLSearchParams();
  params.set('tab', tab);
  if (search) params.set('q', search);
  return (
    <Link
      href={`/admin/submissions?${params.toString()}`}
      className={'tab' + (tab === activeTab ? ' is-active' : '')}
      role="tab"
      aria-selected={tab === activeTab}
    >
      {label}
      <span className="tab-count">{count}</span>
    </Link>
  );
}

function PageLink({
  page, disabled, tab, search, label,
}: {
  page: number;
  disabled: boolean;
  tab: SubmissionStatus;
  search: string;
  label: string;
}) {
  if (disabled) {
    return <span className="page-link is-disabled">{label}</span>;
  }
  const params = new URLSearchParams();
  params.set('tab', tab);
  params.set('page', String(page));
  if (search) params.set('q', search);
  return (
    <Link href={`/admin/submissions?${params.toString()}`} className="page-link">
      {label}
    </Link>
  );
}

function SetupNeeded() {
  return (
    <main className="admin-shell">
      <div className="admin-card">
        <h1>Admin setup needed</h1>
        <p>Supabase env vars are missing. Configure them and redeploy.</p>
      </div>
    </main>
  );
}

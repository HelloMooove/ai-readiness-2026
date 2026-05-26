import Link from 'next/link';
import { notFound } from 'next/navigation';
import { readSupabaseEnv } from '@/lib/supabase/env';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireAdmin } from '../../_components/requireAdmin';
import AdminTopbar from '../../_components/AdminTopbar';
import { QUESTIONS, PHASES, getQuestion } from '@/lib/form-schemas/ai-readiness-2026';
import type { Submission, AnswerValue } from '@/lib/types/submission';

export const dynamic = 'force-dynamic';

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

function renderAnswerValue(v: AnswerValue): React.ReactNode {
  if (v === null || v === undefined) {
    return <span className="answer-empty">— no answer</span>;
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return <span className="answer-empty">— no answer</span>;
    return (
      <ul className="answer-list">
        {v.map((item, i) => (
          <li key={i}>{String(item)}</li>
        ))}
      </ul>
    );
  }
  if (typeof v === 'string' && v.trim() === '') {
    return <span className="answer-empty">— no answer</span>;
  }
  return <span className="answer-text">{String(v)}</span>;
}

export default async function SubmissionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) notFound();
  const s = data as Submission;

  const phasesOrdered: number[] = [1, 2, 3];
  const questionsByPhase: Record<number, typeof QUESTIONS> = { 1: [], 2: [], 3: [] };
  QUESTIONS.forEach((q) => {
    questionsByPhase[q.phase].push(q);
  });

  // Surface any unknown question ids stored in answers (e.g. future
  // questions added after this submission was made)
  const knownIds = new Set(QUESTIONS.map((q) => q.id));
  const unknownIds = Object.keys(s.answers || {}).filter((k) => !knownIds.has(k));

  return (
    <main className="admin-shell">
      <AdminTopbar email={session.email} current="submissions" />
      <div className="page-header">
          <Link href="/admin/submissions" className="back-link">← All submissions</Link>
          <div className="page-header-row">
            <h1>{s.completed_at ? 'Completed submission' : 'Partial submission'}</h1>
            {s.completed_at ? (
              <span className="badge badge-good">✓ Completed</span>
            ) : (
              <span className="badge badge-warn">◷ Partial</span>
            )}
          </div>
          <p className="admin-muted submission-meta">
            Session <code>{s.session_id}</code> · created {fmtDate(s.created_at)} · last activity {fmtDate(s.updated_at)}
            {s.completed_at && <> · completed {fmtDate(s.completed_at)}</>}
          </p>
        </div>

        <section className="admin-card">
          <h2 className="section-title">Contact</h2>
          <dl className="kv-grid">
            <dt>Email</dt><dd>{s.email ?? <span className="answer-empty">—</span>}</dd>
            <dt>Name</dt><dd>{fullName(s)}</dd>
            <dt>Phone</dt><dd>{s.phone ?? <span className="answer-empty">—</span>}</dd>
            <dt>Score</dt><dd>{s.score ?? <span className="answer-empty">—</span>}</dd>
            <dt>Tier</dt><dd>{s.tier ?? <span className="answer-empty">—</span>}</dd>
            <dt>Questions answered</dt><dd>{s.question_count}</dd>
            <dt>Last seen on</dt>
            <dd>
              {s.completed_at
                ? 'Reached the end'
                : s.last_question_id === 'contact'
                  ? 'Contact form'
                  : s.last_question_id
                    ? `${s.last_question_id.toUpperCase()} — ${getQuestion(s.last_question_id)?.text ?? ''}`
                    : '—'}
            </dd>
          </dl>
        </section>

        {phasesOrdered.map((phase) => (
          <section key={phase} className="admin-card">
            <h2 className="section-title">
              Phase {phase} — {PHASES[phase]}
            </h2>
            <div className="answers-list">
              {questionsByPhase[phase].map((q) => {
                const answered = q.id in (s.answers || {});
                return (
                  <div key={q.id} className={'answer-block' + (answered ? '' : ' is-unanswered')}>
                    <div className="answer-q">
                      <span className="answer-qid">{q.id.toUpperCase()}</span>
                      <span className="answer-qtext">{q.text}</span>
                    </div>
                    <div className="answer-v">
                      {renderAnswerValue(s.answers?.[q.id] ?? null)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {unknownIds.length > 0 && (
          <section className="admin-card">
            <h2 className="section-title">Other captured answers</h2>
            <p className="admin-muted">
              Stored on this submission but not in the current form schema (likely from a later schema version).
            </p>
            <div className="answers-list">
              {unknownIds.map((id) => (
                <div key={id} className="answer-block">
                  <div className="answer-q">
                    <span className="answer-qid">{id}</span>
                  </div>
                  <div className="answer-v">
                    {renderAnswerValue(s.answers[id])}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="admin-card admin-card-muted">
          <h2 className="section-title">Metadata</h2>
          <dl className="kv-grid">
            <dt>User agent</dt><dd className="answer-text">{s.user_agent ?? '—'}</dd>
            <dt>Referrer</dt><dd className="answer-text">{s.referrer ?? '—'}</dd>
            <dt>Form</dt><dd><code>{s.form_slug}</code></dd>
          </dl>
        </section>
    </main>
  );
}

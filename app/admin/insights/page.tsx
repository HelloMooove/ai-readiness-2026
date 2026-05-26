import { requireAdmin } from '../_components/requireAdmin';
import AdminTopbar from '../_components/AdminTopbar';
import { readSupabaseEnv } from '@/lib/supabase/env';
import { createServerSupabase } from '@/lib/supabase/server';
import { QUESTIONS, PHASES, getQuestion, type FormQuestion } from '@/lib/form-schemas/ai-readiness-2026';
import { TIER_LABELS_ORDERED } from '@/lib/tiers';
import type { Submission } from '@/lib/types/submission';

export const dynamic = 'force-dynamic';

// Hard cap on rows pulled for in-memory aggregation. Well above expected
// scale; if we ever exceed it we'll move aggregations into Postgres.
const INSIGHTS_LIMIT = 10000;

type AnswerCount = {
  value: string;
  count: number;
  percent: number; // % of respondents to THIS question (not all submissions)
};

type QuestionInsight = {
  question: FormQuestion;
  respondents: number;
  topAnswers: AnswerCount[];
  textSamples: string[];
};

type DropOffRow = {
  questionId: string;
  label: string;
  count: number;
  percent: number;
};

function aggregateQuestion(submissions: Submission[], q: FormQuestion): QuestionInsight {
  let respondents = 0;
  const counts = new Map<string, number>();
  const textSamples: string[] = [];

  for (const s of submissions) {
    const v = s.answers?.[q.id];
    if (v === null || v === undefined) continue;

    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      respondents++;
      for (const item of v) {
        if (item == null) continue;
        const key = String(item);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    } else if (typeof v === 'string' && v.trim()) {
      respondents++;
      if (q.type === 'text') {
        if (textSamples.length < 8) {
          textSamples.push(v.trim().slice(0, 240));
        }
      } else {
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
    }
  }

  const topAnswers = Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      count,
      percent: respondents > 0 ? Math.round((count / respondents) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return { question: q, respondents, topAnswers, textSamples };
}

function aggregateDropOff(partials: Submission[]): DropOffRow[] {
  const counts = new Map<string, number>();
  for (const s of partials) {
    const k = s.last_question_id || '(unknown)';
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const total = partials.length || 1;
  return Array.from(counts.entries())
    .map(([qid, count]) => ({
      questionId: qid,
      label:
        qid === 'contact'
          ? 'Contact form'
          : qid === '(unknown)'
            ? '(unknown step)'
            : `${qid.toUpperCase()} — ${getQuestion(qid)?.text ?? qid}`,
      count,
      percent: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);
}

function aggregateTiers(completed: Submission[]): { tier: string; count: number; percent: number }[] {
  const counts = new Map<string, number>();
  for (const s of completed) {
    const t = s.tier || '(no tier)';
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const total = completed.length || 1;
  // Stable display order — lowest tier to highest. Trailing '(no tier)'
  // catches legacy rows from before the tier column was populated.
  const order = [...TIER_LABELS_ORDERED, '(no tier)'];
  return order
    .map((tier) => ({
      tier,
      count: counts.get(tier) ?? 0,
      percent: Math.round(((counts.get(tier) ?? 0) / total) * 1000) / 10,
    }))
    .filter((r) => r.count > 0);
}

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

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('submissions')
    .select('id, answers, completed_at, score, tier, last_question_id, question_count')
    .limit(INSIGHTS_LIMIT);

  const all = (data ?? []) as Submission[];
  const completed = all.filter((s) => s.completed_at !== null);
  const partial = all.filter((s) => s.completed_at === null);

  const total = all.length;
  const completionRate = total > 0 ? Math.round((completed.length / total) * 1000) / 10 : 0;
  const avgScore =
    completed.length > 0
      ? Math.round(
          completed.reduce((sum, s) => sum + (s.score ?? 0), 0) / completed.length,
        )
      : null;

  const questionInsights = QUESTIONS.map((q) => aggregateQuestion(all, q));
  const dropOff = aggregateDropOff(partial);
  const tiers = aggregateTiers(completed);

  const questionsByPhase: Record<number, QuestionInsight[]> = { 1: [], 2: [], 3: [] };
  questionInsights.forEach((qi) => questionsByPhase[qi.question.phase].push(qi));

  return (
    <main className="admin-shell">
      <AdminTopbar email={session.email} current="insights" />
      <div className="page-header">
        <h1>Insights</h1>
        <p className="admin-muted">Per-question answer breakdown, drop-off points, tier distribution.</p>
      </div>

      {error && (
        <div className="admin-card">
          <div className="admin-error-banner">Failed to load insights: {error.message}</div>
        </div>
      )}

      {/* Top-line stats */}
      <section className="admin-card">
        <div className="stat-grid">
          <div className="stat">
            <span className="stat-label">All submissions</span>
            <span className="stat-value">{total}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Completed</span>
            <span className="stat-value stat-good">{completed.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Partial</span>
            <span className="stat-value stat-warn">{partial.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Completion rate</span>
            <span className="stat-value">{completionRate}%</span>
          </div>
          <div className="stat">
            <span className="stat-label">Avg score (completed)</span>
            <span className="stat-value">{avgScore ?? '—'}</span>
          </div>
        </div>
      </section>

      {/* Tier distribution */}
      {tiers.length > 0 && (
        <section className="admin-card">
          <h2 className="section-title">Tier distribution (completed)</h2>
          <Bars
            rows={tiers.map((t) => ({
              label: t.tier,
              count: t.count,
              percent: t.percent,
            }))}
          />
        </section>
      )}

      {/* Drop-off */}
      {partial.length > 0 && (
        <section className="admin-card">
          <h2 className="section-title">Where partial submissions dropped off</h2>
          <p className="admin-muted insight-sub">
            {partial.length} partial submissions. Higher bars = more people abandoned on that step.
          </p>
          <Bars
            rows={dropOff.map((r) => ({
              label: r.label,
              count: r.count,
              percent: r.percent,
            }))}
          />
        </section>
      )}

      {/* Per-question breakdown */}
      {([1, 2, 3] as const).map((phase) => (
        <section key={phase} className="admin-card">
          <h2 className="section-title">
            Phase {phase} — {PHASES[phase]}
          </h2>
          <div className="insight-q-list">
            {questionsByPhase[phase].map((qi) => (
              <QuestionInsightBlock key={qi.question.id} insight={qi} />
            ))}
          </div>
        </section>
      ))}

      {total === 0 && (
        <section className="admin-card">
          <p className="admin-muted">No submissions yet. Fill out the form to see insights here.</p>
        </section>
      )}
    </main>
  );
}

function QuestionInsightBlock({ insight }: { insight: QuestionInsight }) {
  const q = insight.question;
  return (
    <div className="insight-q">
      <div className="insight-q-header">
        <div>
          <span className="answer-qid">{q.id.toUpperCase()}</span>
          <span className="insight-q-text">{q.text}</span>
        </div>
        <span className="insight-q-meta">
          {insight.respondents} respondent{insight.respondents === 1 ? '' : 's'}
        </span>
      </div>

      {insight.respondents === 0 ? (
        <p className="answer-empty">No answers yet.</p>
      ) : q.type === 'text' ? (
        <ul className="text-samples">
          {insight.textSamples.map((t, i) => (
            <li key={i}>“{t}”</li>
          ))}
          {insight.respondents > insight.textSamples.length && (
            <li className="admin-muted">
              + {insight.respondents - insight.textSamples.length} more — see in Submissions
            </li>
          )}
        </ul>
      ) : (
        <Bars
          rows={insight.topAnswers.map((a) => ({
            label: a.value,
            count: a.count,
            percent: a.percent,
          }))}
        />
      )}
    </div>
  );
}

function Bars({ rows }: { rows: { label: string; count: number; percent: number }[] }) {
  // Bar width is relative to the largest count, not absolute percent, so
  // the visual emphasizes the top choice even when many answers split.
  const maxCount = rows.reduce((m, r) => Math.max(m, r.count), 0) || 1;
  return (
    <div className="insight-bars">
      {rows.map((r, i) => {
        const widthPct = Math.max(2, (r.count / maxCount) * 100);
        return (
          <div className="insight-bar" key={`${r.label}-${i}`}>
            <div
              className="insight-bar-label"
              style={{ ['--bar-width' as string]: `${widthPct}%` }}
            >
              <span>{r.label}</span>
            </div>
            <div className="insight-bar-count">
              <span className="insight-bar-num">{r.count}</span>
              <span className="insight-bar-pct">{r.percent}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

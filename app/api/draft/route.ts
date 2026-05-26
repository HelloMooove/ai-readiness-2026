import { getAdminSupabase } from '@/lib/supabase/admin';

// POST /api/draft — upserts a partial submission row keyed by session_id.
// The public form calls this on every answer change (debounced) so we can
// see drop-offs in the admin. Only updates the columns we send; contact
// info and completion fields (set by /api/submit) are left untouched.
//
// If Supabase is not configured, returns 204 silently so the public form
// continues to work and the user's experience is never affected by a
// missing admin backend.

const ALLOWED_FORM_SLUGS = new Set(['ai-readiness-2026']);

type DraftBody = {
  session_id?: unknown;
  form_slug?: unknown;
  answers?: unknown;
  email?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  phone?: unknown;
  last_question_id?: unknown;
  question_count?: unknown;
  user_agent?: unknown;
  referrer?: unknown;
};

function asNonEmptyString(v: unknown, max = 200): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export async function POST(req: Request) {
  const supabase = getAdminSupabase();
  if (!supabase) {
    // Soft-fail: don't break the public form if admin storage isn't wired up
    return new Response(null, { status: 204 });
  }

  let body: DraftBody;
  try {
    body = (await req.json()) as DraftBody;
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const sessionId =
    typeof body.session_id === 'string' &&
    body.session_id.length >= 8 &&
    body.session_id.length <= 64
      ? body.session_id
      : null;
  if (!sessionId) {
    return Response.json({ error: 'Invalid session_id' }, { status: 400 });
  }

  const formSlug =
    typeof body.form_slug === 'string' && ALLOWED_FORM_SLUGS.has(body.form_slug)
      ? body.form_slug
      : 'ai-readiness-2026';

  const answers =
    body.answers && typeof body.answers === 'object' && !Array.isArray(body.answers)
      ? (body.answers as Record<string, unknown>)
      : {};

  const lastQuestionId = asNonEmptyString(body.last_question_id, 64);
  const questionCount =
    typeof body.question_count === 'number' && Number.isFinite(body.question_count)
      ? Math.max(0, Math.floor(body.question_count))
      : Object.keys(answers).length;

  const userAgent = asNonEmptyString(body.user_agent, 500);
  const referrer = asNonEmptyString(body.referrer, 500);

  // Optional partial contact info — captured even if the user never hits submit.
  // Each upsert sets the current value, so empty → null and filled → stored.
  const email = asNonEmptyString(body.email, 320);
  const firstName = asNonEmptyString(body.first_name, 100);
  const lastName = asNonEmptyString(body.last_name, 100);
  const phone = asNonEmptyString(body.phone, 50);

  const { error } = await supabase.from('submissions').upsert(
    {
      session_id: sessionId,
      form_slug: formSlug,
      answers,
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      last_question_id: lastQuestionId,
      question_count: questionCount,
      user_agent: userAgent,
      referrer,
    },
    { onConflict: 'session_id' },
  );

  if (error) {
    console.error('Draft upsert failed:', error.message);
    return Response.json({ error: 'Draft save failed' }, { status: 500 });
  }

  return new Response(null, { status: 204 });
}

import { getAdminSupabase } from '@/lib/supabase/admin';
import { getFormBySlug, resolveAirtableCreds } from '@/lib/forms';

// POST /api/submit — final submission.
//
// 1) Writes the response to Airtable (existing behavior, unchanged from the
//    static-site version). This is the source of truth visible to the user
//    via the "your answers are safe" UX — if Airtable fails, we return an
//    error to the user.
//
// 2) ALSO marks the corresponding Supabase row as completed (used by the
//    /admin section). Supabase write failures are logged but never surfaced
//    to the user — admin storage must never break the public form.
//
// The frontend sends an envelope of the form:
//   {
//     fields: { 'Email Address': ..., 'First Name': ..., 'AI_Score': ..., 'Q1 - ...': ..., ... },
//     typecast: true,
//     _meta: {                                  // optional, used only for Supabase mirror
//       session_id: 'uuid',
//       form_slug: 'ai-readiness-2026',
//       answers: { q1: '...', q2: [...], ... }, // raw answers keyed by q-id
//       tier: 'MOOOVE' | 'ALIGN' | 'BUILD' | 'SCALE',
//       last_question_id: 'contact',
//       question_count: 19,
//       user_agent: '...',
//       referrer: '...'
//     }
//   }
//
// _meta is stripped before sending to Airtable so the Airtable schema is
// unchanged.

const ALLOWED_FORM_SLUGS = new Set(['ai-readiness-2026']);

type SubmitBody = {
  fields?: Record<string, unknown>;
  typecast?: boolean;
  _meta?: {
    session_id?: unknown;
    form_slug?: unknown;
    answers?: unknown;
    tier?: unknown;
    last_question_id?: unknown;
    question_count?: unknown;
    user_agent?: unknown;
    referrer?: unknown;
  };
};

function asString(v: unknown, max = 200): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

async function mirrorToSupabase(meta: NonNullable<SubmitBody['_meta']>, fields: Record<string, unknown>) {
  const supabase = getAdminSupabase();
  if (!supabase) return;

  const sessionId =
    typeof meta.session_id === 'string' &&
    meta.session_id.length >= 8 &&
    meta.session_id.length <= 64
      ? meta.session_id
      : null;
  if (!sessionId) {
    // No session id means this submission was never previously drafted —
    // we could synthesize one, but skipping keeps the data clean. The
    // Airtable row is still saved either way.
    return;
  }

  const formSlug =
    typeof meta.form_slug === 'string' && ALLOWED_FORM_SLUGS.has(meta.form_slug)
      ? meta.form_slug
      : 'ai-readiness-2026';

  const answers =
    meta.answers && typeof meta.answers === 'object' && !Array.isArray(meta.answers)
      ? (meta.answers as Record<string, unknown>)
      : {};

  const email = asString(fields['Email Address'], 320);
  const firstName = asString(fields['First Name'], 100);
  const lastName = asString(fields['Last Name'], 100);
  const phone = asString(fields['Phone Number'], 50);
  const scoreRaw = fields['AI_Score'];
  const score =
    typeof scoreRaw === 'number' && Number.isFinite(scoreRaw)
      ? Math.round(scoreRaw)
      : null;
  const tier = asString(meta.tier, 50);
  const lastQuestionId = asString(meta.last_question_id, 64);
  const questionCount =
    typeof meta.question_count === 'number' && Number.isFinite(meta.question_count)
      ? Math.max(0, Math.floor(meta.question_count))
      : Object.keys(answers).length;
  const userAgent = asString(meta.user_agent, 500);
  const referrer = asString(meta.referrer, 500);

  // Upsert: creates the row if /api/draft was never called (rare —
  // user finished the whole form before any debounced draft save fired).
  const { error } = await supabase.from('submissions').upsert(
    {
      session_id: sessionId,
      form_slug: formSlug,
      answers,
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      score,
      tier,
      last_question_id: lastQuestionId,
      question_count: questionCount,
      user_agent: userAgent,
      referrer,
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'session_id' },
  );

  if (error) {
    console.error('Supabase mirror failed (Airtable submission already succeeded):', error.message);
  }
}

export async function POST(req: Request) {
  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Strip _meta before sending to Airtable so the Airtable schema is unchanged
  const meta = body._meta;
  const airtablePayload = { fields: body.fields ?? {}, typecast: body.typecast ?? true };

  // Resolve which form this submission belongs to. If the frontend sent a
  // form_slug we use it; otherwise default to the AI Readiness form. The
  // form lookup is wrapped in try/catch inside getFormBySlug so a Supabase
  // outage can't break submissions — we just fall back to env vars.
  const formSlug =
    (typeof meta?.form_slug === 'string' && meta.form_slug.length > 0
      ? meta.form_slug
      : 'ai-readiness-2026');
  const form = await getFormBySlug(formSlug);

  // Resolve Airtable credentials: form-specific values take precedence,
  // env vars are the fallback. This lets the form keep submitting before
  // the admin UI exists to set per-form creds.
  const { pat, baseId, tableName } = resolveAirtableCreds(form);
  if (!pat || !baseId || !tableName) {
    return Response.json(
      { error: 'Server configuration error: Missing Airtable credentials' },
      { status: 500 },
    );
  }

  const airtableUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
    tableName,
  )}`;

  try {
    const response = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(airtablePayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        { error: `Airtable Error: ${errorText}` },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Airtable succeeded — now mirror to Supabase. Failures here do not
    // affect the user-facing response.
    if (meta) {
      try {
        await mirrorToSupabase(meta, airtablePayload.fields);
      } catch (err) {
        console.error('Supabase mirror threw:', err);
      }
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error submitting to Airtable:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

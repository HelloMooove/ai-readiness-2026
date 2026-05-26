import { after } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getFormBySlug, resolveAirtableCreds, type AirtableCreds } from '@/lib/forms';
import { fetchCohortDistribution } from '@/lib/email/cohort';
import { composeEmail, type EmailLang } from '@/lib/email/template';
import { sendEmail } from '@/lib/email/send';

// POST /api/submit — final submission.
//
// 1) Writes the response to Airtable. Source of truth for the user-facing
//    "your answers are safe" UX — Airtable failure surfaces as an error.
//
// 2) Mirrors the row into Supabase (marks completed_at, fills contact +
//    score + tier). Mirror failures are logged only.
//
// 3) Schedules a score email via `after()` (background work, runs once
//    the response is returned). Email failures are logged only — they
//    never affect the submit response.
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
    lang?: unknown;
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

    // Fire the score email AFTER the response is sent (Next.js after()).
    // The user gets a fast response; the email send + cohort fetch happen
    // in the background. Failures are logged but never surface.
    const submitterEmail = asString(airtablePayload.fields['Email Address']);
    const submitterFirstName = asString(airtablePayload.fields['First Name']);
    const submitterScore = airtablePayload.fields['AI_Score'];
    const lang: EmailLang =
      meta && typeof meta.lang === 'string' && meta.lang === 'fr' ? 'fr' : 'en';

    if (submitterEmail && typeof submitterScore === 'number') {
      after(() =>
        sendScoreEmail({
          to: submitterEmail,
          firstName: submitterFirstName,
          score: Math.round(submitterScore),
          lang,
          creds: { pat, baseId, tableName },
        }),
      );
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error submitting to Airtable:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Background work — runs after the response is returned to the user.
// All errors are swallowed (logged only) so a flaky cohort fetch or
// email-provider hiccup never affects the user-facing flow.
async function sendScoreEmail(args: {
  to: string;
  firstName: string | null;
  score: number;
  lang: EmailLang;
  creds: AirtableCreds;
}) {
  try {
    let cohort = null;
    try {
      cohort = await fetchCohortDistribution(args.creds);
    } catch (err) {
      console.error('Cohort fetch failed (email will send without chart):', err);
    }

    const composed = composeEmail({
      firstName: args.firstName,
      score: args.score,
      lang: args.lang,
      cohort,
    });

    const result = await sendEmail({
      to: args.to,
      subject: composed.subject,
      html: composed.html,
      text: composed.text,
    });

    if (!result.ok) {
      console.error('Score email send failed:', result.reason, result.error ?? '');
    }
  } catch (err) {
    console.error('sendScoreEmail threw:', err);
  }
}

export function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

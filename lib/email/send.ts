import { Resend } from 'resend';

// Resend wrapper. Returns null if email isn't configured so callers can
// soft-fail without crashing the submission flow.
//
// Required env: RESEND_API_KEY
// Optional env: EMAIL_FROM (defaults to "MOOOVE <hello@mooove.live>")

let cached: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (cached) return cached;
  cached = new Resend(key);
  return cached;
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM || 'MOOOVE <hello@mooove.live>';
}

export type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; reason: 'not_configured' | 'send_failed'; error?: string };

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<SendResult> {
  const client = getClient();
  if (!client) return { ok: false, reason: 'not_configured' };

  try {
    const res = await client.emails.send({
      from: getFromAddress(),
      to: [to],
      subject,
      html,
      text,
    });
    if (res.error) {
      return { ok: false, reason: 'send_failed', error: res.error.message };
    }
    return { ok: true, id: res.data?.id ?? '' };
  } catch (err) {
    return {
      ok: false,
      reason: 'send_failed',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

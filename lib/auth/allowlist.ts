// Email allowlist for admin access. Sourced from the ADMIN_EMAILS env var
// (comma-separated). Falls back to a single hardcoded address so the system
// is usable before any env var is set.
//
// Long-term this will move to a Supabase table once user-management lands.

const DEFAULT_ADMIN_EMAILS = ['hello@mooove.live'];

export function getAllowlist(): string[] {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw) return DEFAULT_ADMIN_EMAILS;
  const parsed = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : DEFAULT_ADMIN_EMAILS;
}

export function isAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAllowlist().includes(email.trim().toLowerCase());
}

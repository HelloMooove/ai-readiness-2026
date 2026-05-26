import { tierForScore } from '@/lib/tiers';
import type { CohortDistribution } from './cohort';

export type EmailLang = 'en' | 'fr';

export type EmailInput = {
  firstName: string | null;
  score: number;
  lang: EmailLang;
  cohort: CohortDistribution | null;
};

export type ComposedEmail = {
  subject: string;
  html: string;
  text: string;
};

// Brand colors — kept inline because most email clients strip <style> blocks.
const BG = '#0b0e15';
const SURFACE = '#11151f';
const BORDER = '#1f2737';
const TEXT = '#e6eaf2';
const MUTED = '#a8b0c0';
const TEAL = '#3FB8FF';
const TEAL_SOFT = '#1d3a52';

// Per-tier accent colors for the bar chart and the user's tier badge.
const TIER_COLORS: Record<string, string> = {
  'undecided': '#9099aa',
  'ignition':  '#f5993a',
  'momentum':  '#3FB8FF',
  'mastery':   '#a987ff',
  'ai-native': '#80e7b3',
};

function copy(lang: EmailLang) {
  if (lang === 'fr') {
    return {
      subject: 'Votre score de maturité IA',
      hi: (name: string | null) => name ? `Bonjour ${name},` : 'Bonjour,',
      thanks: 'Merci d’avoir complété le diagnostic MOOOVE AI Readiness.',
      scoreLabel: 'Votre score de maturité IA',
      tierLabel: 'Votre tier',
      distHeader: 'Répartition par tier (cohorte actuelle)',
      respondents: (n: number) => `${n} répondant${n === 1 ? '' : 's'}`,
      noCohort: 'Données de cohorte indisponibles pour le moment.',
      signoff: '— MOOOVE',
    };
  }
  return {
    subject: 'Your AI Maturity Score',
    hi: (name: string | null) => name ? `Hi ${name},` : 'Hi,',
    thanks: 'Thank you for completing the MOOOVE AI Readiness diagnostic.',
    scoreLabel: 'Your AI Maturity Score',
    tierLabel: 'Your tier',
    distHeader: 'Tier distribution (current cohort)',
    respondents: (n: number) => `${n} respondent${n === 1 ? '' : 's'}`,
    noCohort: 'Cohort data is unavailable right now.',
    signoff: '— MOOOVE',
  };
}

// Email-safe HTML chart: pure table layout with inline styles. Each tier
// gets a row with label, bar, and count. The user's own tier is highlighted.
function renderChartHtml(cohort: CohortDistribution | null, userTierKey: string, copyFn: ReturnType<typeof copy>) {
  if (!cohort || cohort.total === 0) {
    return `<p style="color:${MUTED};margin:0;font-size:13px">${copyFn.noCohort}</p>`;
  }
  const maxCount = cohort.buckets.reduce((m, b) => Math.max(m, b.count), 0) || 1;

  const rows = cohort.buckets
    .map((b) => {
      const width = Math.max(4, Math.round((b.count / maxCount) * 100));
      const color = TIER_COLORS[b.key] || TEAL;
      const isMine = b.key === userTierKey;
      const labelStyle = `font-size:13px;color:${TEXT};font-weight:${isMine ? '700' : '500'};white-space:nowrap;padding:8px 10px 8px 0;vertical-align:middle;`;
      const rangeStyle = `font-size:11px;color:${MUTED};display:block;font-weight:400;letter-spacing:.04em;`;
      const youBadge = isMine
        ? `<span style="background:${TEAL_SOFT};color:${TEAL};font-size:10px;font-weight:700;padding:2px 6px;border-radius:99px;margin-left:6px;letter-spacing:.06em;">YOU</span>`
        : '';
      return `
        <tr>
          <td style="${labelStyle}">
            ${b.label}${youBadge}
            <span style="${rangeStyle}">${b.rangeLabel}</span>
          </td>
          <td style="padding:8px 0;vertical-align:middle;width:100%;">
            <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${SURFACE};border-radius:6px;overflow:hidden;">
              <tr>
                <td style="width:${width}%;background:${color};height:22px;border-radius:6px;"></td>
                <td style="width:${100 - width}%;"></td>
              </tr>
            </table>
          </td>
          <td style="font-size:13px;color:${TEXT};font-weight:600;padding:8px 0 8px 12px;text-align:right;vertical-align:middle;white-space:nowrap;">
            ${b.count}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <p style="color:${MUTED};margin:0 0 12px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;font-weight:600;">${copyFn.distHeader}</p>
    <p style="color:${MUTED};margin:0 0 14px;font-size:12px;">${copyFn.respondents(cohort.total)}</p>
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
      ${rows}
    </table>
  `;
}

export function composeEmail(input: EmailInput): ComposedEmail {
  const c = copy(input.lang);
  const tier = tierForScore(input.score);
  const tierAccent = TIER_COLORS[tier.key] || TEAL;

  const html = `<!DOCTYPE html>
<html lang="${input.lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${c.subject}</title>
</head>
<body style="margin:0;padding:0;background:${BG};color:${TEXT};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${BG};padding:32px 16px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:${SURFACE};border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 8px;">
              <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:800;font-size:18px;letter-spacing:.16em;color:${TEXT};">MOOOVE</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 0;color:${TEXT};font-size:15px;line-height:1.55;">
              <p style="margin:0 0 6px;">${c.hi(input.firstName)}</p>
              <p style="margin:0;color:${MUTED};">${c.thanks}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 0;">
              <div style="background:#0a0d14;border:1px solid ${BORDER};border-radius:12px;padding:24px;text-align:center;">
                <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};font-weight:600;margin-bottom:8px;">${c.scoreLabel}</div>
                <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:800;font-size:56px;line-height:1;color:${TEXT};margin-bottom:14px;">${input.score}</div>
                <div>
                  <span style="display:inline-block;padding:6px 14px;border-radius:99px;background:${tierAccent}22;color:${tierAccent};border:1px solid ${tierAccent}55;font-size:13px;font-weight:700;letter-spacing:.04em;">
                    ${tier.icon} ${c.tierLabel}: ${tier.label}
                  </span>
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 32px;">
              ${renderChartHtml(input.cohort, tier.key, c)}
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 32px;color:${MUTED};font-size:12px;line-height:1.55;">
              <hr style="border:none;border-top:1px solid ${BORDER};margin:0 0 16px;" />
              <div>${c.signoff}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Plain-text fallback for spam filters + accessibility
  const lines = [
    c.hi(input.firstName),
    '',
    c.thanks,
    '',
    `${c.scoreLabel}: ${input.score}`,
    `${c.tierLabel}: ${tier.label} (${tier.rangeLabel})`,
    '',
  ];
  if (input.cohort && input.cohort.total > 0) {
    lines.push(`${c.distHeader} — ${c.respondents(input.cohort.total)}`);
    for (const b of input.cohort.buckets) {
      const marker = b.key === tier.key ? ' (YOU)' : '';
      lines.push(`  ${b.label} (${b.rangeLabel}): ${b.count}${marker}`);
    }
    lines.push('');
  }
  lines.push(c.signoff);

  return {
    subject: c.subject,
    html,
    text: lines.join('\n'),
  };
}

import { tierForScore, TIER_ORDER, type Tier } from '@/lib/tiers';
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
      insightHeading: 'Votre position dans la cohorte',
      comparisonLabel: 'Par rapport aux autres participants :',
      distHeader: 'Répartition par tier (cohorte actuelle)',
      respondents: (n: number) => `${n} répondant${n === 1 ? '' : 's'}`,
      noCohort: 'Données de cohorte indisponibles pour le moment.',
      stayTunedTitle: 'Restez connectés — ce n’est que le début',
      stayTunedBody: 'Au cours des prochaines semaines, nous partagerons davantage d’analyses et d’opportunités exclusives pour vous aider à mieux comprendre comment l’IA transforme les entreprises aujourd’hui.',
      stayTunedBullets: [
        'Des analyses de tendances IA et des insights marché',
        'Des invitations à des événements et échanges exclusifs',
        'Des ateliers pratiques autour de l’IA',
      ],
      firstWave: 'Vous faites désormais partie de la première vague de participants à l’initiative AI Readiness de MOOOVE.',
      signoff: '— MOOOVE',
    };
  }
  return {
    subject: 'Your AI Maturity Score',
    hi: (name: string | null) => name ? `Hi ${name},` : 'Hi,',
    thanks: 'Thank you for completing the MOOOVE AI Readiness diagnostic.',
    scoreLabel: 'Your AI Maturity Score',
    tierLabel: 'Your tier',
    insightHeading: 'Your position in the cohort',
    comparisonLabel: 'Compared to other participants:',
    distHeader: 'Tier distribution (current cohort)',
    respondents: (n: number) => `${n} respondent${n === 1 ? '' : 's'}`,
    noCohort: 'Cohort data is unavailable right now.',
    stayTunedTitle: 'Stay tuned — more is coming soon',
    stayTunedBody: 'Over the coming weeks, we’ll be sharing additional insights and exclusive opportunities to help you better understand how AI is transforming businesses today.',
    stayTunedBullets: [
      'AI trend analysis and market insights',
      'Invitations to exclusive events and discussions',
      'Hands-on practical AI workshops',
    ],
    firstWave: 'You are now part of the first wave of participants in the MOOOVE AI Readiness initiative.',
    signoff: '— MOOOVE',
  };
}

type TierInsight = {
  opening: string;
  contextLabel: string | null;
  contextBody: string | null;
  bullets: [string, string];
};

// Per-tier narrative copy. Stats (pctTier, pctBelow) are injected when the
// cohort has enough data; otherwise the context line is omitted.
function tierInsight(
  lang: EmailLang,
  tier: Tier,
  pctTier: number,
  pctBelow: number,
  hasStats: boolean,
): TierInsight {
  const FR = lang === 'fr';

  if (tier.key === 'undecided') {
    return {
      opening: FR
        ? 'Votre organisation est actuellement au début de son parcours d’adoption de l’IA.'
        : 'Your organization is at the early stage of its AI adoption journey.',
      contextLabel: hasStats ? (FR ? 'La bonne nouvelle :' : 'The good news:') : null,
      contextBody: hasStats
        ? (FR
            ? `${pctTier}% des organisations de la cohorte sont encore en phase d’exploration — une opportunité importante pour prendre de l’avance rapidement.`
            : `${pctTier}% of organizations in the cohort are still in the Explorer phase — a real opportunity to move ahead quickly.`)
        : null,
      bullets: FR
        ? [
            'vous faites partie des organisations qui commencent à structurer leur réflexion autour de l’IA',
            'plusieurs opportunités d’amélioration opérationnelle et d’automatisation sont accessibles à ce stade',
          ]
        : [
            'you are among the organizations starting to structure their thinking around AI',
            'several operational and automation improvement opportunities are accessible at this stage',
          ],
    };
  }

  if (tier.key === 'ignition') {
    return {
      opening: FR
        ? 'Votre organisation commence à concrétiser son adoption de l’IA.'
        : 'Your organization is starting to translate AI adoption into action.',
      contextLabel: hasStats ? (FR ? 'Le contexte :' : 'The context:') : null,
      contextBody: hasStats
        ? (FR
            ? `Vous avez dépassé ${pctBelow}% de la cohorte — l’IA n’est plus une simple discussion mais une pratique émergente.`
            : `You are ahead of ${pctBelow}% of the cohort — AI is no longer just a conversation but an emerging practice.`)
        : null,
      bullets: FR
        ? [
            'des premiers usages sont en place, mais ils restent souvent ad-hoc et non structurés',
            'le prochain levier consiste à formaliser les pratiques et à mesurer la valeur générée',
          ]
        : [
            'first use cases are in place, but practice remains ad-hoc and unstructured',
            'the next lever is formalizing practices and measuring the value generated',
          ],
    };
  }

  if (tier.key === 'momentum') {
    return {
      opening: FR
        ? 'Votre organisation est en pleine phase d’accélération sur l’IA.'
        : 'Your organization is in a clear acceleration phase on AI.',
      contextLabel: hasStats ? (FR ? 'Le contexte :' : 'The context:') : null,
      contextBody: hasStats
        ? (FR
            ? `Vous êtes en avance sur ${pctBelow}% de la cohorte — vos outils et processus IA sont déjà actifs.`
            : `You are ahead of ${pctBelow}% of the cohort — your AI tools and processes are already live.`)
        : null,
      bullets: FR
        ? [
            'des cas d’usage concrets sont déployés, avec une valeur visible mais encore inégale',
            'le prochain levier consiste à structurer la gouvernance et à étendre les déploiements à grande échelle',
          ]
        : [
            'concrete use cases are deployed, with visible but still uneven value',
            'the next lever is structuring governance and scaling deployments more broadly',
          ],
    };
  }

  if (tier.key === 'mastery') {
    return {
      opening: FR
        ? 'Votre organisation se distingue clairement dans son parcours d’adoption de l’IA.'
        : 'Your organization clearly stands out in its AI adoption journey.',
      contextLabel: hasStats ? (FR ? 'Le contexte :' : 'The context:') : null,
      contextBody: hasStats
        ? (FR
            ? `Seules ${pctTier}% des organisations atteignent ce niveau — vous êtes en avance sur ${pctBelow}% de la cohorte.`
            : `Only ${pctTier}% of organizations reach this level — you are ahead of ${pctBelow}% of the cohort.`)
        : null,
      bullets: FR
        ? [
            'l’IA est intégrée à vos opérations et vos KPIs sont suivis en continu',
            'le prochain levier porte sur la gouvernance et l’avantage compétitif durable',
          ]
        : [
            'AI is embedded in your operations and your KPIs are tracked continuously',
            'the next lever is governance and durable competitive advantage',
          ],
    };
  }

  // ai-native
  return {
    opening: FR
      ? 'Votre organisation fait partie des leaders du marché en matière d’IA.'
      : 'Your organization is among the market leaders in AI.',
    contextLabel: hasStats ? (FR ? 'Le contexte :' : 'The context:') : null,
    contextBody: hasStats
      ? (FR
          ? `Seules ${pctTier}% des organisations atteignent ce niveau — l’IA est au cœur de votre modèle opérationnel.`
          : `Only ${pctTier}% of organizations reach this level — AI is at the core of your operating model.`)
      : null,
    bullets: FR
      ? [
          'vos workflows, décisions et produits sont alimentés par l’IA',
          'la compétition se joue désormais sur la capacité IA, pas sur le rattrapage',
        ]
      : [
          'your workflows, decisions, and products are powered by AI',
          'the competition is now on AI capability, not catching up',
        ],
  };
}

function renderInsightHtml(
  tier: Tier,
  cohort: CohortDistribution | null,
  copyFn: ReturnType<typeof copy>,
  lang: EmailLang,
): string {
  // Need at least 3 respondents before quoting cohort percentages (otherwise
  // stats like "100% are in this phase" are misleading at n=1 or n=2).
  const hasStats = !!cohort && cohort.total >= 3;
  let pctTier = 0;
  let pctBelow = 0;
  if (hasStats && cohort) {
    const tierCount = cohort.buckets.find((b) => b.key === tier.key)?.count ?? 0;
    pctTier = Math.round((100 * tierCount) / cohort.total);
    const userIdx = TIER_ORDER.indexOf(tier.key);
    const belowCount = cohort.buckets
      .filter((b) => TIER_ORDER.indexOf(b.key) < userIdx)
      .reduce((sum, b) => sum + b.count, 0);
    pctBelow = Math.round((100 * belowCount) / cohort.total);
  }

  const ins = tierInsight(lang, tier, pctTier, pctBelow, hasStats);

  const contextHtml = ins.contextBody && ins.contextLabel
    ? `<p style="margin:0 0 16px;color:${TEXT};font-size:14px;line-height:1.55;">
         <strong style="color:${TEAL};">${ins.contextLabel}</strong> ${ins.contextBody}
       </p>`
    : '';

  return `
    <p style="color:${MUTED};margin:0 0 12px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;font-weight:600;">${copyFn.insightHeading}</p>
    <p style="margin:0 0 14px;color:${TEXT};font-size:14px;line-height:1.55;">${ins.opening}</p>
    ${contextHtml}
    <p style="margin:0 0 8px;color:${TEXT};font-size:14px;line-height:1.55;font-weight:600;">${copyFn.comparisonLabel}</p>
    <ul style="margin:0;padding:0 0 0 18px;color:${MUTED};font-size:13px;line-height:1.6;">
      <li style="margin-bottom:6px;">${ins.bullets[0]}</li>
      <li>${ins.bullets[1]}</li>
    </ul>
  `;
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
            <td style="padding:28px 32px 0;">
              ${renderInsightHtml(tier, input.cohort, c, input.lang)}
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 0;">
              ${renderChartHtml(input.cohort, tier.key, c)}
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 0;">
              <div style="background:#0a0d14;border:1px solid ${BORDER};border-radius:12px;padding:20px 22px;">
                <div style="font-size:15px;font-weight:700;color:${TEXT};margin:0 0 8px;">${c.stayTunedTitle}</div>
                <p style="margin:0 0 14px;color:${MUTED};font-size:13px;line-height:1.6;">${c.stayTunedBody}</p>
                <ul style="margin:0;padding:0 0 0 18px;color:${TEXT};font-size:13px;line-height:1.7;">
                  ${c.stayTunedBullets.map((b) => `<li>${b}</li>`).join('')}
                </ul>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 0;color:${MUTED};font-size:13px;line-height:1.55;">
              ${c.firstWave}
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 32px;color:${MUTED};font-size:12px;line-height:1.55;">
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

  // Insight block — same copy as HTML, in plain text.
  const hasStats = !!input.cohort && input.cohort.total >= 3;
  let pctTier = 0;
  let pctBelow = 0;
  if (hasStats && input.cohort) {
    const tierCount = input.cohort.buckets.find((b) => b.key === tier.key)?.count ?? 0;
    pctTier = Math.round((100 * tierCount) / input.cohort.total);
    const userIdx = TIER_ORDER.indexOf(tier.key);
    const belowCount = input.cohort.buckets
      .filter((b) => TIER_ORDER.indexOf(b.key) < userIdx)
      .reduce((sum, b) => sum + b.count, 0);
    pctBelow = Math.round((100 * belowCount) / input.cohort.total);
  }
  const ins = tierInsight(input.lang, tier, pctTier, pctBelow, hasStats);
  lines.push(c.insightHeading.toUpperCase());
  lines.push(ins.opening);
  if (ins.contextLabel && ins.contextBody) {
    lines.push(`${ins.contextLabel} ${ins.contextBody}`);
  }
  lines.push(c.comparisonLabel);
  lines.push(`  • ${ins.bullets[0]}`);
  lines.push(`  • ${ins.bullets[1]}`);
  lines.push('');

  if (input.cohort && input.cohort.total > 0) {
    lines.push(`${c.distHeader} — ${c.respondents(input.cohort.total)}`);
    for (const b of input.cohort.buckets) {
      const marker = b.key === tier.key ? ' (YOU)' : '';
      lines.push(`  ${b.label} (${b.rangeLabel}): ${b.count}${marker}`);
    }
    lines.push('');
  }

  lines.push(c.stayTunedTitle);
  lines.push(c.stayTunedBody);
  for (const b of c.stayTunedBullets) {
    lines.push(`  • ${b}`);
  }
  lines.push('');
  lines.push(c.firstWave);
  lines.push('');
  lines.push(c.signoff);

  return {
    subject: c.subject,
    html,
    text: lines.join('\n'),
  };
}

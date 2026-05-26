// AI Readiness tier definitions — the 5-tier framework used by the
// MOOOVE dashboard at gmhr.vercel.app. The /public/app.js client has a
// parallel copy of this table (vanilla JS, can't import from TS) — keep
// the two in sync when ranges change.

export type TierKey = 'undecided' | 'ignition' | 'momentum' | 'mastery' | 'ai-native';

export type Tier = {
  key: TierKey;
  label: string;
  icon: string;
  rangeLabel: string;
  test: (score: number) => boolean;
};

export const TIERS: Tier[] = [
  { key: 'undecided', label: 'Undecided', icon: '❓', rangeLabel: '0 – 19',     test: (s) => s <= 19 },
  { key: 'ignition',  label: 'Ignition',  icon: '🔥', rangeLabel: '20 – 44',    test: (s) => s >= 20 && s <= 44 },
  { key: 'momentum',  label: 'Momentum',  icon: '⚙️', rangeLabel: '45 – 74',    test: (s) => s >= 45 && s <= 74 },
  { key: 'mastery',   label: 'Mastery',   icon: '🚀', rangeLabel: '75 – 104',   test: (s) => s >= 75 && s <= 104 },
  { key: 'ai-native', label: 'AI-Native', icon: '✨', rangeLabel: '105 – 140',  test: (s) => s >= 105 },
];

// Display order for charts and breakdowns (lowest → highest tier).
export const TIER_ORDER: TierKey[] = ['undecided', 'ignition', 'momentum', 'mastery', 'ai-native'];

// Stable order with English labels — useful for matching `tier` strings
// stored on submissions rows.
export const TIER_LABELS_ORDERED: string[] = TIERS.map((t) => t.label);

export function tierForScore(score: number): Tier {
  const s = Number.isFinite(score) ? score : 0;
  return TIERS.find((t) => t.test(s)) ?? TIERS[0];
}

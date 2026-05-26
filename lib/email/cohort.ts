import { TIERS, TIER_ORDER, type Tier, type TierKey } from '@/lib/tiers';
import type { AirtableCreds } from '@/lib/forms';

// Fetches the AI_Score column of every record in the form's Airtable
// table and computes how many submissions fall in each tier. Returns
// counts in TIER_ORDER (lowest tier → highest).
//
// At our expected volume (≤ a few hundred records) a single Airtable
// page is enough, but we still paginate to be safe. Each Airtable list
// call returns max 100 records.

export type TierBucket = {
  key: TierKey;
  label: string;
  rangeLabel: string;
  count: number;
};

export type CohortDistribution = {
  total: number;
  buckets: TierBucket[]; // ordered by TIER_ORDER
};

export async function fetchCohortDistribution(
  creds: AirtableCreds,
): Promise<CohortDistribution | null> {
  if (!creds.pat || !creds.baseId || !creds.tableName) return null;

  const base = `https://api.airtable.com/v0/${creds.baseId}/${encodeURIComponent(creds.tableName)}`;
  let offset: string | undefined = undefined;
  const scores: number[] = [];

  // Pull up to ~10 pages (1000 records). More than enough at our scale.
  for (let page = 0; page < 10; page++) {
    const url = new URL(base);
    url.searchParams.set('pageSize', '100');
    // Only fetch the score column to keep the response small
    url.searchParams.append('fields[]', 'AI_Score');
    if (offset) url.searchParams.set('offset', offset);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${creds.pat}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Airtable cohort fetch failed: ${res.status} ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      records: { fields: { AI_Score?: number | string } }[];
      offset?: string;
    };

    for (const rec of data.records) {
      const raw = rec.fields.AI_Score;
      const n = typeof raw === 'number' ? raw : Number(raw);
      if (Number.isFinite(n)) scores.push(n);
    }

    if (!data.offset) break;
    offset = data.offset;
  }

  // Count scores per tier
  const countsByKey = new Map<TierKey, number>();
  for (const score of scores) {
    const tier: Tier = TIERS.find((t) => t.test(score)) ?? TIERS[0];
    countsByKey.set(tier.key, (countsByKey.get(tier.key) ?? 0) + 1);
  }

  const buckets: TierBucket[] = TIER_ORDER.map((key) => {
    const tier = TIERS.find((t) => t.key === key)!;
    return {
      key,
      label: tier.label,
      rangeLabel: tier.rangeLabel,
      count: countsByKey.get(key) ?? 0,
    };
  });

  return { total: scores.length, buckets };
}

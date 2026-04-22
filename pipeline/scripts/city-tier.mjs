// City tier ETL for Plotrip.
// Scrapes GaWC 2024 world city classifications and stores as city_attributes.
// Maps GaWC tiers (Alpha++ … Gamma/Minimal) to a 1–5 numeric scale.
//
// Usage:
//   env $(cat .env | xargs) node scripts/etl/city-tier.mjs

import { getClient, upsertCityAttributes, saveRawPayload, sleep } from './lib/supa.mjs';

const GAWC_URL =
  'https://gawc.lboro.ac.uk/gawc-worlds/the-world-according-to-gawc/world-cities-2024/';

// GaWC label → numeric tier (1–5)
const TIER_MAP = {
  'Alpha ++': 5, 'Alpha+': 5, 'Alpha +': 5,
  'Alpha': 4, 'Alpha-': 4, 'Alpha -': 4,
  'Beta+': 3, 'Beta +': 3, 'Beta': 3,
  'Beta-': 2, 'Beta -': 2, 'Gamma+': 2, 'Gamma +': 2,
  'Gamma': 1, 'High Sufficiency': 1, 'Sufficiency': 1, 'Minimal': 1,
};

// Canonical sort order for matching — longest first to avoid partial matches
const TIER_LABELS = Object.keys(TIER_MAP).sort((a, b) => b.length - a.length);

function parseGawc(html) {
  // GaWC page lists tiers as headings followed by city names.
  // Strategy: find tier-heading anchors/headings, then collect city names until next heading.
  const results = []; // { name, label, tier }

  // Normalise whitespace
  const clean = html.replace(/\r\n/g, '\n').replace(/&amp;/g, '&').replace(/&#\d+;/g, '');

  let currentLabel = null;
  let currentTier = null;

  // Split by HTML tags — we walk tag-by-tag looking for heading text then <li>/<td> city names
  const tagRe = /<[^>]+>|[^<]+/g;
  let m;
  let inHeading = false;
  let inItem = false;
  let textBuf = '';

  while ((m = tagRe.exec(clean)) !== null) {
    const tok = m[0];

    if (tok.startsWith('<')) {
      const tag = tok.toLowerCase();
      // Heading open tags
      if (/^<h[2-4][\s>]/.test(tag)) { inHeading = true; textBuf = ''; continue; }
      if (/^<\/h[2-4]>/.test(tag)) {
        if (inHeading) {
          const text = textBuf.trim();
          const matched = TIER_LABELS.find((l) => text.includes(l));
          if (matched) { currentLabel = matched; currentTier = TIER_MAP[matched]; }
          inHeading = false;
        }
        textBuf = '';
        continue;
      }
      // List / table cell open
      if (/^<(li|td)[\s>]/.test(tag) && currentTier != null) { inItem = true; textBuf = ''; continue; }
      if (/^<\/(li|td)>/.test(tag)) {
        if (inItem && currentTier != null) {
          const city = textBuf.trim().replace(/\s+/g, ' ');
          if (city.length > 1 && city.length < 60) {
            results.push({ name: city, label: currentLabel, tier: currentTier });
          }
        }
        inItem = false;
        textBuf = '';
        continue;
      }
    } else {
      // Text node
      if (inHeading || inItem) textBuf += tok;
    }
  }

  return results;
}

async function main() {
  const supa = getClient();

  console.log('[city-tier] fetching GaWC 2024...');
  const res = await fetch(GAWC_URL, {
    headers: { 'User-Agent': 'plotrip-etl/1.0', Accept: 'text/html' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from GaWC`);
  const html = await res.text();

  const cities = parseGawc(html);
  console.log(`[city-tier] parsed ${cities.length} city entries from GaWC`);
  if (cities.length === 0) {
    console.error('[city-tier] parse returned 0 entries — HTML structure may have changed');
    process.exit(1);
  }

  await saveRawPayload({ source: 'gawc_2024', cityId: null, payload: { url: GAWC_URL, count: cities.length, cities } });

  let matched = 0;
  let skipped = 0;
  const rows = [];

  for (const entry of cities) {
    try {
      const { data, error } = await supa
        .from('catalog_cities')
        .select('id, name')
        .ilike('name', entry.name)
        .limit(1);
      if (error) throw error;
      if (!data || data.length === 0) {
        // Try partial match — "New York City" vs "New York"
        const { data: data2, error: err2 } = await supa
          .from('catalog_cities')
          .select('id, name')
          .ilike('name', `%${entry.name.split(' ')[0]}%`)
          .limit(1);
        if (err2 || !data2?.length) {
          console.warn(`[city-tier] no match: "${entry.name}"`);
          skipped++;
          continue;
        }
        const row = { city_id: data2[0].id, key: 'gawc_tier', value: { tier: entry.tier, label: entry.label, source: 'gawc_2024' }, source: 'gawc_2024' };
        rows.push(row);
        console.log(`[city-tier] fuzzy "${entry.name}" → ${data2[0].name} (tier ${entry.tier})`);
        matched++;
      } else {
        rows.push({ city_id: data[0].id, key: 'gawc_tier', value: { tier: entry.tier, label: entry.label, source: 'gawc_2024' }, source: 'gawc_2024' });
        console.log(`[city-tier] matched "${entry.name}" tier=${entry.tier} (${entry.label})`);
        matched++;
      }
    } catch (err) {
      console.warn(`[city-tier] error matching "${entry.name}": ${err.message}`);
      skipped++;
    }
    await sleep(20); // DB rate limit
  }

  if (rows.length > 0) {
    await upsertCityAttributes(rows);
  }
  console.log(`[city-tier] done. matched=${matched} skipped=${skipped} upserted=${rows.length}`);
}

main().catch((e) => {
  console.error('[city-tier] fatal:', e);
  process.exit(1);
});

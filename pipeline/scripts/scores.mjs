// Scores ETL stub for Plotrip.
// Hand-curated numbers — most real sources (safety indices, cost indices)
// are paid or require scraping. Replace with real feeds later.
//
// Usage:
//   env $(cat .env | xargs) node scripts/etl/scores.mjs

import { SEED_CITIES } from './lib/seed.mjs';
import { resolveCityId, upsertCityScores } from './lib/supa.mjs';

// visitor_mix values should sum to ~1.0.
const CURATED = {
  'Tokyo':        { safety: 92, cost_tier: 3, language_ease: 35, photogenic: 90,
                    visitor_mix: { couples: 0.35, families: 0.25, solo: 0.20, backpackers: 0.10, luxury: 0.10 } },
  'Lisbon':       { safety: 85, cost_tier: 2, language_ease: 70, photogenic: 88,
                    visitor_mix: { couples: 0.30, families: 0.15, solo: 0.25, backpackers: 0.20, luxury: 0.10 } },
  'Reykjavik':    { safety: 95, cost_tier: 3, language_ease: 85, photogenic: 95,
                    visitor_mix: { couples: 0.40, families: 0.15, solo: 0.25, backpackers: 0.10, luxury: 0.10 } },
  'Bangkok':      { safety: 65, cost_tier: 1, language_ease: 40, photogenic: 80,
                    visitor_mix: { couples: 0.20, families: 0.15, solo: 0.20, backpackers: 0.35, luxury: 0.10 } },
  'Cape Town':    { safety: 55, cost_tier: 2, language_ease: 85, photogenic: 92,
                    visitor_mix: { couples: 0.30, families: 0.20, solo: 0.20, backpackers: 0.15, luxury: 0.15 } },
  'New York':     { safety: 72, cost_tier: 3, language_ease: 95, photogenic: 90,
                    visitor_mix: { couples: 0.30, families: 0.25, solo: 0.25, backpackers: 0.10, luxury: 0.10 } },
  'Kyoto':        { safety: 94, cost_tier: 2, language_ease: 30, photogenic: 96,
                    visitor_mix: { couples: 0.40, families: 0.20, solo: 0.25, backpackers: 0.10, luxury: 0.05 } },
  'Denpasar':     { safety: 70, cost_tier: 1, language_ease: 55, photogenic: 90,
                    visitor_mix: { couples: 0.30, families: 0.20, solo: 0.15, backpackers: 0.25, luxury: 0.10 } },
  'Cairo':        { safety: 50, cost_tier: 1, language_ease: 45, photogenic: 88,
                    visitor_mix: { couples: 0.25, families: 0.20, solo: 0.15, backpackers: 0.30, luxury: 0.10 } },
  'Buenos Aires': { safety: 68, cost_tier: 2, language_ease: 50, photogenic: 85,
                    visitor_mix: { couples: 0.30, families: 0.15, solo: 0.25, backpackers: 0.20, luxury: 0.10 } },
};

async function main() {
  const rows = [];
  for (const city of SEED_CITIES) {
    const curated = CURATED[city.name];
    if (!curated) {
      console.warn(`[scores] SKIP ${city.name}: no curated entry`);
      continue;
    }
    const id = await resolveCityId(city.name);
    if (!id) {
      console.warn(`[scores] SKIP ${city.name}: not found in catalog_cities`);
      continue;
    }
    rows.push({ city_id: id, ...curated });
    console.log(`[scores] ${city.name} (id=${id}) queued`);
  }

  if (rows.length === 0) {
    console.warn('[scores] nothing to write');
    return;
  }
  await upsertCityScores(rows);
  console.log(`[scores] wrote ${rows.length} rows`);
}

main().catch((e) => {
  console.error('[scores] fatal:', e);
  process.exit(1);
});

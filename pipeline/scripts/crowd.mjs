// Crowd ETL stub for Plotrip.
// Computes crowd_index (bell curve around peak month), season_label
// (peak/shoulder/off), and event_count (aggregated from `events`).
// UPDATES city_monthly rows that climate.mjs has already inserted.
//
// Usage:
//   env $(cat .env | xargs) node scripts/etl/crowd.mjs

import { SEED_CITIES } from './lib/seed.mjs';
import { getClient, resolveCityId, upsertCityMonthly } from './lib/supa.mjs';

// Peak tourism month(s) per city, hand-picked.
const PEAK_MONTH = {
  'Tokyo':        4,   // Cherry Blossom
  'Lisbon':       7,   // Summer
  'Reykjavik':    7,   // Midnight sun (aurora in Feb is secondary peak)
  'Bangkok':      12,  // Cool/dry season
  'Cape Town':    1,   // Southern summer
  'New York':     7,   // Summer tourism
  'Kyoto':        4,   // Cherry Blossom (+ Nov foliage)
  'Denpasar':     8,   // Dry season, Euro/Aus holidays
  'Cairo':        11,  // Mild weather
  'Buenos Aires': 11,  // Spring
};

// Cyclical distance between two months (1..12).
function monthDist(a, b) {
  const d = Math.abs(a - b);
  return Math.min(d, 12 - d); // 0..6
}

// Bell curve: peak=100, falls off to ~20 at distance 6.
function crowdIndex(month, peak) {
  const d = monthDist(month, peak);
  // sigma ~ 2.2 gives ~100 at d=0, ~86 at d=1, ~57 at d=2, ~30 at d=3, ~13 at d=4, ~5 at d=5, ~1 at d=6
  const sigma = 2.2;
  const raw = 100 * Math.exp(-(d * d) / (2 * sigma * sigma));
  // Floor at 15 so off-season isn't literally 0.
  return Math.max(15, Math.round(raw));
}

function seasonLabel(idx) {
  if (idx >= 70) return 'peak';
  if (idx >= 40) return 'shoulder';
  return 'off';
}

async function eventCountsByMonth(cityId) {
  const supa = getClient();
  const { data, error } = await supa
    .from('events')
    .select('start_date, end_date')
    .eq('city_id', cityId);
  if (error) throw error;
  const counts = Array(13).fill(0); // index 1..12
  for (const ev of data || []) {
    if (!ev.start_date) continue;
    const sm = Number(ev.start_date.slice(5, 7));
    const em = ev.end_date ? Number(ev.end_date.slice(5, 7)) : sm;
    if (sm <= em) {
      for (let m = sm; m <= em; m++) counts[m]++;
    } else {
      for (let m = sm; m <= 12; m++) counts[m]++;
      for (let m = 1; m <= em; m++) counts[m]++;
    }
  }
  return counts;
}

async function runCity(city) {
  const id = await resolveCityId(city.name);
  if (!id) {
    console.warn(`[crowd] SKIP ${city.name}: not in catalog_cities`);
    return;
  }
  const peak = PEAK_MONTH[city.name];
  if (!peak) {
    console.warn(`[crowd] SKIP ${city.name}: no peak month configured`);
    return;
  }
  const evCounts = await eventCountsByMonth(id);

  const rows = [];
  for (let m = 1; m <= 12; m++) {
    const idx = crowdIndex(m, peak);
    rows.push({
      city_id: id,
      month: m,
      crowd_index: idx,
      season_label: seasonLabel(idx),
      event_count: Math.min(32767, evCounts[m] || 0),
    });
  }
  await upsertCityMonthly(rows);
  console.log(`[crowd] ${city.name} (id=${id}) updated 12 months, peak=${peak}`);
}

async function main() {
  for (const city of SEED_CITIES) {
    try {
      await runCity(city);
    } catch (err) {
      console.error(`[crowd] ERROR ${city.name}:`, err.message);
    }
  }
  console.log('[crowd] done');
}

main().catch((e) => {
  console.error('[crowd] fatal:', e);
  process.exit(1);
});

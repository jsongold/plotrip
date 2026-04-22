// Events ETL stub for Plotrip.
// Hand-curated annual events per seed city. recurring=true.
//
// TODO: integrate Ticketmaster Discovery API and/or Wikipedia's
// "Events in <city>" pages to auto-populate and keep fresh. Ticketmaster
// requires an API key; Wikipedia would need parsing and dedupe.
//
// Usage:
//   env $(cat .env | xargs) node scripts/etl/events.mjs

import { SEED_CITIES } from './lib/seed.mjs';
import { resolveCityId, insertEvents } from './lib/supa.mjs';

// Dates are representative (for a nominal year). Peak months matter more
// than exact days at this stage.
const CURATED = {
  'Tokyo': [
    { name: 'Cherry Blossom (Hanami)',   start_date: '2026-03-25', end_date: '2026-04-10', category: 'nature' },
    { name: 'Sumida River Fireworks',    start_date: '2026-07-25', end_date: '2026-07-25', category: 'festival' },
    { name: 'Fuji Rock Festival',        start_date: '2026-07-24', end_date: '2026-07-26', category: 'music' },
  ],
  'Lisbon': [
    { name: 'Festas de Lisboa',          start_date: '2026-06-01', end_date: '2026-06-30', category: 'festival' },
    { name: 'NOS Alive',                 start_date: '2026-07-09', end_date: '2026-07-11', category: 'music' },
  ],
  'Reykjavik': [
    { name: 'Aurora Season Peak',        start_date: '2026-02-01', end_date: '2026-03-15', category: 'nature' },
    { name: 'Secret Solstice',           start_date: '2026-06-19', end_date: '2026-06-21', category: 'music' },
    { name: 'Iceland Airwaves',          start_date: '2026-11-04', end_date: '2026-11-07', category: 'music' },
  ],
  'Bangkok': [
    { name: 'Songkran Water Festival',   start_date: '2026-04-13', end_date: '2026-04-15', category: 'festival' },
    { name: 'Loy Krathong (Lantern)',    start_date: '2026-11-24', end_date: '2026-11-24', category: 'festival' },
  ],
  'Cape Town': [
    { name: 'Cape Town Jazz Festival',   start_date: '2026-03-27', end_date: '2026-03-28', category: 'music' },
    { name: 'Kaapse Klopse (Minstrel)',  start_date: '2026-01-02', end_date: '2026-01-02', category: 'festival' },
  ],
  'New York': [
    { name: 'New Year in Times Square',  start_date: '2026-12-31', end_date: '2026-12-31', category: 'festival' },
    { name: 'Governors Ball Music Fest', start_date: '2026-06-05', end_date: '2026-06-07', category: 'music' },
    { name: 'Tribeca Film Festival',     start_date: '2026-06-10', end_date: '2026-06-21', category: 'film' },
  ],
  'Kyoto': [
    { name: 'Cherry Blossom (Hanami)',   start_date: '2026-03-28', end_date: '2026-04-12', category: 'nature' },
    { name: 'Gion Matsuri',              start_date: '2026-07-01', end_date: '2026-07-31', category: 'festival' },
    { name: 'Autumn Foliage (Momiji)',   start_date: '2026-11-15', end_date: '2026-12-05', category: 'nature' },
  ],
  'Denpasar': [
    { name: 'Nyepi (Day of Silence)',    start_date: '2026-03-19', end_date: '2026-03-19', category: 'culture' },
    { name: 'Bali Arts Festival',        start_date: '2026-06-13', end_date: '2026-07-11', category: 'festival' },
  ],
  'Cairo': [
    { name: 'Abu Simbel Sun Festival',   start_date: '2026-02-22', end_date: '2026-02-22', category: 'culture' },
    { name: 'Cairo International Film',  start_date: '2026-11-12', end_date: '2026-11-21', category: 'film' },
  ],
  'Buenos Aires': [
    { name: 'Carnaval Porteño',          start_date: '2026-02-14', end_date: '2026-02-17', category: 'festival' },
    { name: 'Tango BA Festival',         start_date: '2026-08-13', end_date: '2026-08-26', category: 'culture' },
    { name: 'Lollapalooza Argentina',    start_date: '2026-03-20', end_date: '2026-03-22', category: 'music' },
  ],
};

async function main() {
  const rows = [];
  for (const city of SEED_CITIES) {
    const list = CURATED[city.name];
    if (!list) continue;
    const id = await resolveCityId(city.name);
    if (!id) {
      console.warn(`[events] SKIP ${city.name}: not in catalog_cities`);
      continue;
    }
    for (const e of list) {
      rows.push({
        city_id: id,
        name: e.name,
        start_date: e.start_date,
        end_date: e.end_date,
        category: e.category,
        source: 'curated',
        source_url: null,
        coords: null,
        recurring: true,
      });
    }
    console.log(`[events] ${city.name} (id=${id}) queued ${list.length} events`);
  }

  if (rows.length === 0) {
    console.warn('[events] nothing to insert');
    return;
  }
  await insertEvents(rows);
  console.log(`[events] inserted (or skipped as dupes) ${rows.length} events`);
}

main().catch((e) => {
  console.error('[events] fatal:', e);
  process.exit(1);
});

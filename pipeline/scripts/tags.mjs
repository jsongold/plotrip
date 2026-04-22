// Tags ETL for Plotrip.
// Queries OSM Overpass API for POI counts within a 10km radius of each seed
// city, then maps counts to weighted tags from the fixed Plotrip vocabulary.
//
// Usage:
//   env $(cat .env | xargs) node scripts/etl/tags.mjs

import { SEED_CITIES } from './lib/seed.mjs';
import {
  resolveCityId,
  upsertCityTags,
  saveRawPayload,
  sleep,
} from './lib/supa.mjs';

const OVERPASS = 'https://overpass-api.de/api/interpreter';
const RADIUS_M = 10000;

const TAG_VOCAB = new Set([
  'beach','nightlife','cuisine','wellness','history','nature','mountains',
  'winter-sports','family','romantic','backpacker','luxury','nomad',
  'cherry-blossom','aurora','desert','diving','festival-heavy','gardens',
  'culture','food','adventure','festival',
]);

function buildQuery(lat, lng) {
  const around = `(around:${RADIUS_M},${lat},${lng})`;
  // One Overpass query with counted categories via out count.
  // We run 1 query per city and parse the elements.
  return `
[out:json][timeout:60];
(
  node["natural"="beach"]${around};
  node["tourism"="museum"]${around};
  node["amenity"="bar"]${around};
  node["amenity"="nightclub"]${around};
  node["amenity"="restaurant"]${around};
  node["natural"="peak"]${around};
  node["leisure"="garden"]${around};
  node["tourism"="attraction"]${around};
  node["historic"]${around};
  node["amenity"="spa"]${around};
);
out tags;
`.trim();
}

function categorize(elements) {
  const counts = {
    beach: 0, museum: 0, bar: 0, nightclub: 0, restaurant: 0,
    peak: 0, garden: 0, attraction: 0, historic: 0, spa: 0,
  };
  for (const el of elements || []) {
    const t = el.tags || {};
    if (t.natural === 'beach') counts.beach++;
    else if (t.tourism === 'museum') counts.museum++;
    else if (t.amenity === 'bar') counts.bar++;
    else if (t.amenity === 'nightclub') counts.nightclub++;
    else if (t.amenity === 'restaurant') counts.restaurant++;
    else if (t.natural === 'peak') counts.peak++;
    else if (t.leisure === 'garden') counts.garden++;
    else if (t.tourism === 'attraction') counts.attraction++;
    else if (t.historic) counts.historic++;
    else if (t.amenity === 'spa') counts.spa++;
  }
  return counts;
}

// Clip a count to a 0..1 weight using a simple cap-based scale.
function scale(count, cap) {
  if (count <= 0) return 0;
  const v = Math.min(1, count / cap);
  return Number(v.toFixed(3));
}

function weightsFromCounts(c) {
  const out = {};
  const add = (tag, w) => {
    if (!TAG_VOCAB.has(tag)) return;
    if (w <= 0) return;
    // keep max if duplicated
    out[tag] = Math.max(out[tag] || 0, Number(w.toFixed(3)));
  };

  add('beach', scale(c.beach, 10));
  add('culture', scale(c.museum + c.historic * 0.3, 40));
  add('history', scale(c.historic, 50));
  add('nightlife', scale(c.bar * 0.5 + c.nightclub, 40));
  add('cuisine', scale(c.restaurant, 400));
  add('food', scale(c.restaurant, 400));
  add('mountains', scale(c.peak, 10));
  add('nature', scale(c.peak * 0.5 + c.garden, 25));
  add('gardens', scale(c.garden, 15));
  add('wellness', scale(c.spa, 15));
  return out;
}

async function overpassFetch(query) {
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'plotrip-etl/1.0',
      Accept: 'application/json',
    },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Overpass HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function runCity(city) {
  const id = await resolveCityId(city.name);
  if (!id) {
    console.warn(`[tags] SKIP ${city.name}: not found in catalog_cities`);
    return;
  }

  console.log(`[tags] querying Overpass for ${city.name} (id=${id})`);
  const payload = await overpassFetch(buildQuery(city.lat, city.lng));
  const counts = categorize(payload.elements);
  console.log(`[tags] ${city.name} counts:`, counts);

  await saveRawPayload({ source: 'overpass', cityId: id, payload: { counts, query_radius_m: RADIUS_M } });

  const weights = weightsFromCounts(counts);
  const rows = Object.entries(weights).map(([tag, weight]) => ({
    city_id: id,
    tag,
    weight,
  }));

  if (rows.length === 0) {
    console.warn(`[tags] ${city.name}: no tags derived`);
    return;
  }
  await upsertCityTags(rows);
  console.log(`[tags] ${city.name}: wrote ${rows.length} tags`);
}

async function main() {
  for (const city of SEED_CITIES) {
    try {
      await runCity(city);
    } catch (err) {
      console.error(`[tags] ERROR ${city.name}:`, err.message);
    }
    await sleep(1500); // respect Overpass; >1s between requests.
  }
  console.log('[tags] done');
}

main().catch((e) => {
  console.error('[tags] fatal:', e);
  process.exit(1);
});

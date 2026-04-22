// Climate shape ETL for Plotrip.
// Builds a 30km circle buffer around each seed city, intersects with
// Natural Earth 50m land polygons, simplifies, and stores the result in
// catalog_cities.climate_poly (JSONB GeoJSON Feature).
//
// Runs once per city. NOT part of run-all.mjs on purpose — shapes are
// near-static; only re-run when adding new cities or changing the radius.
//
// Usage:
//   env $(cat .env | xargs) node scripts/etl/climate-shapes.mjs
//   env $(cat .env | xargs) node scripts/etl/climate-shapes.mjs --city=Tokyo
//   env $(cat .env | xargs) node scripts/etl/climate-shapes.mjs --force

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import circle from '@turf/circle';
import intersect from '@turf/intersect';
import simplify from '@turf/simplify';
import { SEED_CITIES } from './lib/seed.mjs';
import { getClient, resolveCityId, sleep } from './lib/supa.mjs';

const RADIUS_MAX_KM = 30;
const RADIUS_MIN_KM = 15;
const NEIGHBOR_RATIO = 0.45; // slightly < 0.5 leaves a small gap between adjacent circles
const TIER2_MIN_POPULATION = 1_000_000;
const CIRCLE_STEPS = 64;
const SIMPLIFY_TOLERANCE = 0.005; // ~550m in degrees; yields ~1–5KB per city
const SIMPLIFY_HIGH_QUALITY = false;

function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function radiusKmFor(city, tier2Cities) {
  let nearest = Infinity;
  for (const t of tier2Cities) {
    if (t.id === city._catalogId) continue;
    const d = haversineKm(city, t);
    if (d < nearest) nearest = d;
  }
  if (!Number.isFinite(nearest)) return RADIUS_MAX_KM;
  return Math.max(RADIUS_MIN_KM, Math.min(RADIUS_MAX_KM, nearest * NEIGHBOR_RATIO));
}

async function fetchTier2Cities() {
  const supa = getClient();
  const { data, error } = await supa
    .from('catalog_cities')
    .select('id,name,lat,lng,population')
    .gte('population', TIER2_MIN_POPULATION);
  if (error) throw error;
  console.log(`[climate-shapes] loaded ${data.length} tier-2 cities (pop >= ${TIER2_MIN_POPULATION.toLocaleString()})`);
  return data;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const LAND_PATH = join(__dirname, 'data', 'ne_50m_land.geojson');

let LAND_CACHE = null;
function loadLand() {
  if (LAND_CACHE) return LAND_CACHE;
  try {
    LAND_CACHE = JSON.parse(readFileSync(LAND_PATH, 'utf8'));
  } catch (err) {
    console.error(
      `[climate-shapes] cannot read ${LAND_PATH}\n` +
        `Download it with:\n` +
        `  curl -L -o ${LAND_PATH} https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson`,
    );
    throw err;
  }
  return LAND_CACHE;
}

function buildLandClippedCircle(lat, lng, radiusKm) {
  const buffer = circle([lng, lat], radiusKm, {
    steps: CIRCLE_STEPS,
    units: 'kilometers',
  });

  const pieces = [];
  for (const f of loadLand().features) {
    try {
      const clip = intersect({ type: 'FeatureCollection', features: [buffer, f] });
      if (clip) pieces.push(clip);
    } catch {
      // turf can throw on degenerate rings; skip that land feature.
    }
  }

  let result;
  if (pieces.length === 0) {
    // No land overlap — shouldn't happen for seed cities, but keep a sane fallback.
    result = buffer;
  } else if (pieces.length === 1) {
    result = pieces[0];
  } else {
    result = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'MultiPolygon',
        coordinates: pieces.flatMap((p) =>
          p.geometry.type === 'Polygon'
            ? [p.geometry.coordinates]
            : p.geometry.coordinates,
        ),
      },
    };
  }

  return simplify(result, {
    tolerance: SIMPLIFY_TOLERANCE,
    highQuality: SIMPLIFY_HIGH_QUALITY,
  });
}

async function runCity(city, { force, tier2Cities }) {
  const supa = getClient();
  const id = await resolveCityId(city.name);
  if (!id) {
    console.warn(`[climate-shapes] SKIP ${city.name}: not found in catalog_cities`);
    return;
  }

  if (!force) {
    const { data, error } = await supa
      .from('catalog_cities')
      .select('climate_poly')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (data?.climate_poly) {
      console.log(`[climate-shapes] SKIP ${city.name}: already populated (use --force)`);
      return;
    }
  }

  city._catalogId = id;
  const radiusKm = radiusKmFor(city, tier2Cities);
  const poly = buildLandClippedCircle(city.lat, city.lng, radiusKm);
  const bytes = Buffer.byteLength(JSON.stringify(poly));
  console.log(
    `[climate-shapes] ${city.name}: r=${radiusKm.toFixed(1)}km ${bytes} B (${poly.geometry.type})`,
  );

  const { error } = await supa
    .from('catalog_cities')
    .update({ climate_poly: poly })
    .eq('id', id);
  if (error) throw error;
}

async function resolveTargets(cityFilter) {
  if (!cityFilter) return SEED_CITIES;

  const seedMatch = SEED_CITIES.filter((c) => c.name.toLowerCase() === cityFilter);
  if (seedMatch.length > 0) return seedMatch;

  const supa = getClient();
  const { data, error } = await supa
    .from('catalog_cities')
    .select('id,name,lat,lng,country')
    .ilike('name', cityFilter);
  if (error) throw error;
  if (data && data.length > 0) {
    return data.map((c) => ({ name: c.name, lat: c.lat, lng: c.lng, country: c.country, _catalogId: c.id }));
  }
  return [];
}

async function main() {
  const cityArgs = process.argv.filter((a) => a.startsWith('--city='));
  const force = process.argv.includes('--force');

  let targets;
  if (cityArgs.length > 0) {
    targets = [];
    for (const arg of cityArgs) {
      const filter = arg.slice('--city='.length).toLowerCase();
      const resolved = await resolveTargets(filter);
      targets.push(...resolved);
    }
  } else {
    targets = SEED_CITIES;
  }

  if (targets.length === 0) {
    console.error(`[climate-shapes] no cities matched`);
    process.exit(1);
  }

  const tier2Cities = await fetchTier2Cities();

  for (const city of targets) {
    try {
      await runCity(city, { force, tier2Cities });
    } catch (err) {
      console.error(`[climate-shapes] ERROR ${city.name}:`, err.message);
    }
    await sleep(50);
  }
  console.log('[climate-shapes] done');
}

main().catch((e) => {
  console.error('[climate-shapes] fatal:', e);
  process.exit(1);
});

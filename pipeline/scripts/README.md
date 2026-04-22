# Plotrip ETL

Local Node scripts to refresh enrichment data in Supabase. No CI/cron — run
manually when you want fresher data. Data doesn't change often enough to
justify scheduling.

## Requirements

- Node 20+ (uses native `fetch`)
- A `.env` file at repo root with:

  ```
  SUPABASE_URL=https://<project>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
  ```

  The **service role key** is required (these scripts bypass RLS to write to
  `catalog_cities`-adjacent tables). Do not commit `.env`.

- No new npm deps. Uses only `@supabase/supabase-js` (already installed),
  plus Node built-ins.

## Running

All scripts read env from `process.env`. We do not load dotenv. The simplest
pattern:

```bash
# one-off, single script
env $(cat .env | xargs) node scripts/etl/climate.mjs

# full pipeline
env $(cat .env | xargs) node scripts/etl/run-all.mjs
```

Or `source` a shell-friendly version of `.env` first:

```bash
set -a; source .env; set +a
node scripts/etl/run-all.mjs
```

## Scripts

| Script        | Purpose                                                      | Typical refresh |
|---------------|--------------------------------------------------------------|-----------------|
| `climate.mjs` | Fetches 5y of daily weather from Open-Meteo archive; writes monthly normals (avg high/low, precip) to `city_monthly`. Saves raw payload to `etl_raw`. | Once per year |
| `tags.mjs`    | Queries OSM Overpass for POI counts within 10km; maps to weighted tags in `city_tags`. | Every 6-12 months |
| `scores.mjs`  | Hand-curated safety / cost / language / photogenic / visitor_mix per city. Writes `city_scores`. | As needed (edit file) |
| `events.mjs`  | Hand-curated annual events. `recurring=true`. Writes `events`. TODO: Ticketmaster/Wikipedia auto-feed. | As needed (edit file) |
| `crowd.mjs`   | Computes bell-curve crowd_index around a hand-picked peak month per city, derives season_label, aggregates event_count from `events`. Updates `city_monthly`. | After `events.mjs` changes |
| `climate-shapes.mjs` | Builds 30km circle buffer per city, clips to Natural Earth land, simplifies, writes to `catalog_cities.climate_poly`. **Not in `run-all.mjs`** — run once per new city. | Once per city |
| `run-all.mjs` | Runs climate → tags → scores → events → crowd in order. (Does not include `climate-shapes.mjs` — that's a one-shot.) | Quarterly or ad hoc |

### climate.mjs

```bash
env $(cat .env | xargs) node scripts/etl/climate.mjs              # all seed cities
env $(cat .env | xargs) node scripts/etl/climate.mjs --city=Tokyo # one city
```

Uses `https://archive-api.open-meteo.com/v1/archive`. Endpoint chosen over
`climate-api` because it is key-free, low-rate-limit, and returns real observed
data for all ten seed cities. 5-year window averaged into monthly normals.
`sun_hours` is left null (not reliably returned by the archive endpoint's
default variables). Raw daily payload saved to `etl_raw` with sha256 dedupe.

### tags.mjs

Spaces Overpass requests ~1.5s apart and sets `User-Agent: plotrip-etl/1.0`.
Counts are scaled to 0..1 weights and mapped into the fixed Plotrip tag
vocabulary only. Unknown tags are never written.

### crowd.mjs

Must run **after** `events.mjs` so event_counts-per-month are accurate. Uses
Gaussian around a city-specific peak month (sigma≈2.2, floor=15).

## Idempotency

- `city_monthly`, `city_tags`, `city_scores` use upserts on their natural
  primary keys.
- `etl_raw` dedupes on `(source, payload_hash)`.
- `events` has no natural unique key — `insertEvents` pre-filters against
  existing `(city_id, name, start_date, source)` tuples before insert.

Running `run-all.mjs` twice should produce no duplicates.

## Seed cities

Defined in `lib/seed.mjs`: Tokyo, Lisbon, Reykjavik, Bangkok, Cape Town,
New York, Kyoto, Denpasar (Bali), Cairo, Buenos Aires. Their
`catalog_cities.id` is resolved at runtime by name lookup; missing names are
warned and skipped (we never invent IDs).

## Error handling

Each script processes cities in a loop. A single city's failure is logged but
does not abort the run. Only env-config errors (missing Supabase creds) exit
non-zero.

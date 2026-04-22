// Supabase client + upsert helpers for Plotrip ETL.
// Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from process.env.
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

let _client = null;

export function getClient() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing env: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. ' +
        'Run with: env $(cat .env | xargs) node scripts/etl/<script>.mjs'
    );
  }
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

export function sha256(obj) {
  const raw = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return createHash('sha256').update(raw).digest('hex');
}

// Resolves a catalog_cities.id for a given name. Returns null if not found.
export async function resolveCityId(name) {
  const supa = getClient();
  const { data, error } = await supa
    .from('catalog_cities')
    .select('id, name')
    .ilike('name', name)
    .limit(1);
  if (error) throw error;
  if (!data || data.length === 0) return null;
  return data[0].id;
}

// Idempotent raw-payload save. Dedupe via (source, payload_hash) unique index.
export async function saveRawPayload({ source, cityId = null, payload }) {
  const supa = getClient();
  const hash = sha256(payload);
  const row = {
    source,
    city_id: cityId,
    payload_hash: hash,
    payload,
  };
  const { error } = await supa
    .from('etl_raw')
    .upsert(row, { onConflict: 'source,payload_hash', ignoreDuplicates: true });
  if (error) throw error;
  return hash;
}

// Upsert one or more rows into city_monthly. Caller provides full rows.
export async function upsertCityMonthly(rows) {
  if (!rows || rows.length === 0) return;
  const supa = getClient();
  const stamped = rows.map((r) => ({ ...r, updated_at: new Date().toISOString() }));
  const { error } = await supa
    .from('city_monthly')
    .upsert(stamped, { onConflict: 'city_id,month' });
  if (error) throw error;
}

export async function upsertCityTags(rows) {
  if (!rows || rows.length === 0) return;
  const supa = getClient();
  const { error } = await supa
    .from('city_tags')
    .upsert(rows, { onConflict: 'city_id,tag' });
  if (error) throw error;
}

export async function upsertCityScores(rows) {
  if (!rows || rows.length === 0) return;
  const supa = getClient();
  const stamped = rows.map((r) => ({ ...r, updated_at: new Date().toISOString() }));
  const { error } = await supa
    .from('city_scores')
    .upsert(stamped, { onConflict: 'city_id' });
  if (error) throw error;
}

// Events don't have a natural unique key in the migration; we dedupe manually
// by (city_id, name, start_date, source) before inserting.
export async function insertEvents(rows) {
  if (!rows || rows.length === 0) return;
  const supa = getClient();

  const byCity = new Map();
  for (const r of rows) {
    if (!byCity.has(r.city_id)) byCity.set(r.city_id, []);
    byCity.get(r.city_id).push(r);
  }

  for (const [cityId, cityRows] of byCity.entries()) {
    const { data: existing, error: selErr } = await supa
      .from('events')
      .select('name, start_date, source')
      .eq('city_id', cityId);
    if (selErr) throw selErr;
    const seen = new Set(
      (existing || []).map((e) => `${e.name}|${e.start_date}|${e.source || ''}`)
    );
    const toInsert = cityRows.filter(
      (r) => !seen.has(`${r.name}|${r.start_date}|${r.source || ''}`)
    );
    if (toInsert.length === 0) continue;
    const { error } = await supa.from('events').insert(toInsert);
    if (error) throw error;
  }
}

// Fetch JSON with a User-Agent (required by Overpass / polite for Open-Meteo).
export async function fetchJson(url, { headers = {}, timeoutMs = 30000 } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'plotrip-etl/1.0', Accept: 'application/json', ...headers },
      signal: ctl.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} for ${url}: ${body.slice(0, 200)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function upsertCityAttributes(rows) {
  if (!rows || rows.length === 0) return;
  const supa = getClient();
  const stamped = rows.map((r) => ({ ...r, updated_at: new Date().toISOString() }));
  const { error } = await supa
    .from('city_attributes')
    .upsert(stamped, { onConflict: 'city_id,key' });
  if (error) throw error;
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

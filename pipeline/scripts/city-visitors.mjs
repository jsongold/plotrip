// City visitors ETL for Plotrip.
// Scrapes Wikipedia "List of cities by international visitors" and stores
// annual visitor counts as city_attributes (key='annual_visitors').
//
// Usage:
//   env $(cat .env | xargs) node scripts/etl/city-visitors.mjs

import { getClient, upsertCityAttributes, saveRawPayload, sleep } from './lib/supa.mjs';

const WIKI_URL =
  'https://en.wikipedia.org/wiki/List_of_cities_by_international_visitors';

function parseWikipediaVisitors(html) {
  // Wikipedia wikitable: columns are City, Country, Region, Visitors (millions), Year, Source
  // Rows are inside <table class="wikitable ..."> <tbody> <tr> <td>...</td> ...
  const results = []; // { city, country, visitors_millions, year }

  // Find the first wikitable
  const tableMatch = html.match(/<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return results;

  const tableHtml = tableMatch[1];

  // Extract rows (skip header <th> rows)
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRe.exec(tableHtml)) !== null) {
    const rowHtml = rowMatch[1];
    // Skip header rows
    if (/<th[\s>]/i.test(rowHtml)) continue;

    // Extract cell text
    const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRe.exec(rowHtml)) !== null) {
      // Strip inner HTML tags, decode entities
      const text = cellMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#\d+;/g, '')
        .replace(/\[\d+\]/g, '') // footnotes [1]
        .trim();
      cells.push(text);
    }

    if (cells.length < 4) continue;

    const city = cells[0].replace(/\s+/g, ' ').trim();
    const country = cells[1].replace(/\s+/g, ' ').trim();
    // visitors cell may be "22.78" or "22,780,000" or "22.78 million"
    const visitorRaw = cells[3].replace(/,/g, '').replace(/\s+/g, ' ').trim();
    const yearRaw = cells[4]?.trim() || '';

    if (!city || !visitorRaw) continue;

    // Parse visitors — assume millions if < 1000, else raw count
    let visitors_millions = null;
    const num = parseFloat(visitorRaw);
    if (!isNaN(num)) {
      visitors_millions = num < 1000 ? num : Number((num / 1_000_000).toFixed(2));
    }
    if (visitors_millions == null || visitors_millions <= 0) continue;

    const year = parseInt(yearRaw, 10) || null;

    results.push({ city, country, visitors_millions, year });
  }

  return results;
}

async function main() {
  const supa = getClient();

  console.log('[city-visitors] fetching Wikipedia...');
  const res = await fetch(WIKI_URL, {
    headers: { 'User-Agent': 'plotrip-etl/1.0 (https://github.com/jsongold/plotrip)', Accept: 'text/html' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from Wikipedia`);
  const html = await res.text();

  const entries = parseWikipediaVisitors(html);
  console.log(`[city-visitors] parsed ${entries.length} entries from Wikipedia`);
  if (entries.length === 0) {
    console.error('[city-visitors] parse returned 0 entries — table structure may have changed');
    process.exit(1);
  }

  await saveRawPayload({ source: 'wiki_cities_by_visitors', cityId: null, payload: { url: WIKI_URL, count: entries.length, entries } });

  let matched = 0;
  let skipped = 0;
  const rows = [];

  for (const entry of entries) {
    try {
      const { data, error } = await supa
        .from('catalog_cities')
        .select('id, name, country')
        .ilike('name', entry.city)
        .limit(3);
      if (error) throw error;

      let city = null;
      if (data && data.length === 1) {
        city = data[0];
      } else if (data && data.length > 1) {
        // Multiple name matches — disambiguate by country
        city = data.find((c) => c.country?.toLowerCase().includes(entry.country.toLowerCase().slice(0, 4))) || data[0];
      }

      if (!city) {
        console.warn(`[city-visitors] no match: "${entry.city}" (${entry.country})`);
        skipped++;
        continue;
      }

      rows.push({
        city_id: city.id,
        key: 'annual_visitors',
        value: {
          visitors_millions: entry.visitors_millions,
          year: entry.year,
          source: 'wiki_cities_by_visitors',
        },
        source: 'wiki_cities_by_visitors',
      });
      console.log(`[city-visitors] "${entry.city}" → ${entry.visitors_millions}M visitors (${entry.year})`);
      matched++;
    } catch (err) {
      console.warn(`[city-visitors] error "${entry.city}": ${err.message}`);
      skipped++;
    }
    await sleep(20);
  }

  if (rows.length > 0) {
    await upsertCityAttributes(rows);
  }
  console.log(`[city-visitors] done. matched=${matched} skipped=${skipped} upserted=${rows.length}`);
}

main().catch((e) => {
  console.error('[city-visitors] fatal:', e);
  process.exit(1);
});

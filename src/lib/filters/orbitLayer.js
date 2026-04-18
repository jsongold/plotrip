import L from 'leaflet';
import { supabase } from '../supabase';
import { minPopForZoom } from '../../hooks/useCatalogLoader';
import { maxPinsForMap } from '../mapDensity';

/**
 * N 個の satellite を top arc に並べるための (x, y) オフセット配列を返す。
 * @param {number} n
 * @param {number} [R=48]
 */
export function orbitPositions(n, R = 48) {
  if (n <= 0) return [];
  if (n === 1) return [{ x: 0, y: -R - 4 }];
  const spread = Math.min(160, 38 * (n - 1));
  const start = -spread / 2;
  const step = spread / (n - 1);
  const out = [];
  for (let i = 0; i < n; i++) {
    const deg = start + i * step;
    const rad = (deg * Math.PI) / 180;
    out.push({ x: Math.round(R * Math.sin(rad)), y: Math.round(-R * Math.cos(rad)) - 4 });
  }
  return out;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/**
 * @param {{lat:number, lng:number, name?:string}} city
 * @param {Array<{emoji:string, color:string, label?:string, slug?:string}>} segments
 */
export function makeOrbitMarker(city, segments) {
  const positions = orbitPositions(segments.length, 48);
  const satellites = segments.map((seg, i) => {
    const { x, y } = positions[i];
    const delay = i * 45;
    return (
      `<div class="orbit-satellite" ` +
        `style="--dx:${x}px;--dy:${y}px;` +
        `border:1.5px solid transparent;` +
        `color:${seg.color};` +
        `animation-delay:${delay}ms;" ` +
        `title="${escapeHtml(seg.label || seg.slug || '')}">` +
        `<span>${seg.emoji}</span>` +
      `</div>`
    );
  }).join('');

  const html = (
    `<div style="position:relative;width:1px;height:1px;pointer-events:none;">` +
      satellites +
    `</div>`
  );

  const icon = L.divIcon({
    className: 'orbit-root',
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 44],
  });
  return L.marker([city.lat, city.lng], {
    icon,
    interactive: false,
    keyboard: false,
    zIndexOffset: 600,
  });
}

/**
 * @param {any} map
 * @param {{layerGroup:any, month:number, values?:any}} ctx
 * @param {{filters: Array<any>, pxPerPin?:number}} config
 * @returns {() => void} cleanup
 */
export function mountOrbitLayer(map, ctx, config) {
  const { layerGroup, month, values } = ctx;
  const { filters, pxPerPin = 45000 } = config;
  const getValue = (slug) => {
    if (!values) return null;
    if (typeof values.get === 'function') return values.get(slug) ?? null;
    return values[slug] ?? null;
  };

  let cancelled = false;
  let reqId = 0;
  let debounceTimer = null;

  const load = async () => {
    if (cancelled) return;
    const myReqId = ++reqId;
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const maxN = maxPinsForMap(map, { pxPerPin });

    if (maxN <= 0 || filters.length === 0) {
      layerGroup.clearLayers();
      return;
    }

    const minPop = minPopForZoom(zoom);
    const { data: catalog, error: catErr } = await supabase
      .from('catalog_cities')
      .select('id,name,lat,lng')
      .gte('lat', bounds.getSouth())
      .lte('lat', bounds.getNorth())
      .gte('lng', bounds.getWest())
      .lte('lng', bounds.getEast())
      .gte('population', minPop)
      .order('population', { ascending: false })
      .limit(Math.max(maxN * 2, 50));
    if (cancelled || myReqId !== reqId) return;
    if (catErr) {
      console.warn('[orbit] catalog_cities query error:', catErr.message);
      return;
    }

    const ids = (catalog || []).map((c) => c.id);
    if (ids.length === 0) {
      layerGroup.clearLayers();
      return;
    }

    const results = await Promise.all(
      filters.map(async (f) => {
        const value = getValue(f.slug);
        try {
          const map_ = await f.fetchSegmentData({ cityIds: ids, month, value });
          return { slug: f.slug, filter: f, extras: map_ || new Map(), value };
        } catch (e) {
          console.warn(`[orbit:${f.slug}] fetchSegmentData error:`, e?.message || e);
          return { slug: f.slug, filter: f, extras: new Map(), value };
        }
      })
    );
    if (cancelled || myReqId !== reqId) return;

    const perCity = (catalog || []).map((city) => {
      const segments = [];
      for (const r of results) {
        const extra = r.extras.get(city.id);
        if (extra == null) continue;
        const seg = r.filter.toSegment(extra, { value: r.value });
        if (!seg) continue;
        segments.push({ slug: r.slug, ...seg });
      }
      return { city, segments };
    });
    const withData = perCity.filter((x) => x.segments.length > 0);
    const withoutData = perCity.filter((x) => x.segments.length === 0);
    const sorted = [...withData, ...withoutData].slice(0, maxN);

    layerGroup.clearLayers();
    let drawn = 0;
    for (const { city, segments } of sorted) {
      if (segments.length === 0) continue;
      const marker = makeOrbitMarker(city, segments);
      if (marker) {
        marker.addTo(layerGroup);
        drawn++;
      }
    }
    console.log(`[orbit] zoom=${zoom}, drawn ${drawn} of ${sorted.length}`);
  };

  const debouncedLoad = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(load, 300);
  };

  load();
  map.on('zoomend', debouncedLoad);
  map.on('moveend', debouncedLoad);

  return () => {
    cancelled = true;
    if (debounceTimer) clearTimeout(debounceTimer);
    map.off('zoomend', debouncedLoad);
    map.off('moveend', debouncedLoad);
    layerGroup.clearLayers();
  };
}

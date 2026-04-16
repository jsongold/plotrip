import L from 'leaflet';
import { supabase } from '../supabase';
import { minPopForZoom } from '../../hooks/useCatalogLoader';
import { maxPinsForMap } from '../mapDensity';

/**
 * 表示範囲の catalog_cities を取得し、filter ごとの描画関数に渡す共通レイヤー。
 *
 * 各 filter は以下を指定するだけでよい:
 *   - fetchExtra:   city_id -> 任意の extra データを返す Map
 *   - draw(city, extra) => L.Layer | L.Layer[] | null
 *     → 返した layer を layerGroup に追加。null でその都市をスキップ
 *
 * 密度: デフォルトで viewport-area ベース (maxPinsForMap, pxPerPin 45000).
 * zoom bucket 方式 (maxCountForZoom) も互換で受け付ける。
 *
 * @typedef {{label:string, emoji:string, color:string}} BadgeContent
 *
 * @typedef {Object} CatalogLayerConfig
 * @property {string} slug
 * @property {(zoom:number) => number} [maxCountForZoom] - 旧 zoom bucket 方式 (後方互換)
 * @property {number} [pxPerPin] - viewport-area 密度 (デフォルト 45000 px²/pin)
 * @property {(args:{cityIds:number[], month:number}) => Promise<Map<number, any>>} fetchExtra
 * @property {(city:any, extra:any) => (any|any[]|null)} draw
 */

/**
 * @param {any} map
 * @param {{layerGroup:any, month:number}} ctx
 * @param {CatalogLayerConfig} config
 * @returns {() => void} cleanup
 */
export function mountCatalogLayer(map, ctx, config) {
  const { layerGroup, month } = ctx;
  const { slug, maxCountForZoom, pxPerPin = 45000, fetchExtra, draw } = config;

  let cancelled = false;
  let reqId = 0;
  let debounceTimer = null;

  const load = async () => {
    if (cancelled) return;
    const myReqId = ++reqId;
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const maxN = typeof maxCountForZoom === 'function'
      ? maxCountForZoom(zoom)
      : maxPinsForMap(map, { pxPerPin });

    if (maxN <= 0) {
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
      console.warn(`[${slug}] catalog_cities query error:`, catErr.message);
      return;
    }

    const ids = (catalog || []).map((c) => c.id);
    if (ids.length === 0) {
      layerGroup.clearLayers();
      return;
    }

    let extraMap = new Map();
    try {
      extraMap = (await fetchExtra({ cityIds: ids, month })) || new Map();
    } catch (e) {
      console.warn(`[${slug}] fetchExtra error:`, e?.message || e);
    }
    if (cancelled || myReqId !== reqId) return;

    // 優先順位: (1) データ有り (2) 人口降順 (DB が既に order なのでそのまま維持)
    const enriched = (catalog || []).map((c) => ({ city: c, extra: extraMap.get(c.id) }));
    const withData = enriched.filter((x) => x.extra != null);
    const withoutData = enriched.filter((x) => x.extra == null);
    const sorted = [...withData, ...withoutData].slice(0, maxN);

    layerGroup.clearLayers();
    let drawn = 0;
    for (const { city, extra } of sorted) {
      const result = draw(city, extra);
      if (!result) continue;
      const layers = Array.isArray(result) ? result : [result];
      for (const layer of layers) {
        if (layer) layer.addTo(layerGroup);
      }
      drawn++;
    }
    console.log(`[${slug}] zoom=${zoom}, drawn ${drawn}/${sorted.length} of ${catalog?.length ?? 0} catalog`);
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

/**
 * 後方互換: 従来の badge-only 用ショートカット。
 * @deprecated use `mountCatalogLayer` with `makeBadgeMarker`
 */
export function mountCatalogBadgeLayer(map, ctx, config) {
  return mountCatalogLayer(map, ctx, {
    slug: config.slug,
    maxCountForZoom: config.maxBadgesForZoom,
    fetchExtra: config.fetchExtra,
    draw: (city, extra) => {
      const content = config.render(extra);
      if (!content) return null;
      return makeBadgeMarker(city, content);
    },
  });
}

/**
 * divIcon の rounded badge marker。
 * @param {{lat:number, lng:number}} city
 * @param {BadgeContent} content
 * @returns {any}
 */
export function makeBadgeMarker(city, { emoji, label, color }) {
  const html = (
    `<div style="` +
      `display:inline-flex;align-items:center;gap:4px;` +
      `transform:translate(-50%, -100%);` +
      `white-space:nowrap;` +
      `background:#fff;` +
      `border:1.5px solid ${color};` +
      `border-radius:999px;` +
      `padding:3px 10px 3px 8px;` +
      `font-size:12px;font-weight:600;` +
      `color:${color};` +
      `box-shadow:0 2px 8px rgba(0,0,0,0.15);` +
      `pointer-events:none;` +
    `">` +
      `<span style="font-size:13px">${emoji}</span>` +
      `<span>${label}</span>` +
    `</div>`
  );
  const icon = L.divIcon({ className: 'catalog-badge', html, iconSize: null, iconAnchor: [0, 44] });
  return L.marker([city.lat, city.lng], { icon, interactive: false, keyboard: false, zIndexOffset: 500 });
}

/**
 * N 個の satellite を top arc に並べるための (x, y) オフセット配列を返す。
 * y は上向きが負。
 * @param {number} n
 * @param {number} [R=28] 軌道半径 (px)
 */
export function orbitPositions(n, R = 48) {
  if (n <= 0) return [];
  if (n === 1) return [{ x: 0, y: -R - 4 }];
  const spread = Math.min(160, 38 * (n - 1)); // 総弧度 (度)
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

/**
 * 複数 active filter を一本化し、都市ごとに radial orbit アイコンを 1 つ描く layer。
 *
 * 各 filter は以下を実装する:
 *   - fetchSegmentData({cityIds, month}) => Promise<Map<cityId, extra>>
 *   - toSegment(extra) => {emoji, color, label?} | null
 *
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

/**
 * 都市 1 つあたり N segment を top arc に配置した divIcon を作る。
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
    iconAnchor: [0, 44], // pin のアイコン上端に合わせる
  });
  return L.marker([city.lat, city.lng], {
    icon,
    interactive: false,
    keyboard: false,
    zIndexOffset: 600,
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/**
 * lat/lng を中心にした bbox polygon。climate 等で climate_poly が無いときの MVP 用。
 * 将来 DB に region_poly / climate_poly が入ったらそれを優先して渡す。
 * @param {{lat:number, lng:number}} city
 * @param {{color:string, fillColor?:string, fillOpacity?:number, weight?:number, dashArray?:string}} style
 * @param {number} [halfDeg=0.5]
 */
export function makeBboxPolygon(city, style, halfDeg = 0.5) {
  const { lat, lng } = city;
  const bounds = [
    [lat - halfDeg, lng - halfDeg],
    [lat - halfDeg, lng + halfDeg],
    [lat + halfDeg, lng + halfDeg],
    [lat + halfDeg, lng - halfDeg],
  ];
  return L.polygon(bounds, {
    weight: 1.5,
    fillOpacity: 0.3,
    interactive: false,
    ...style,
  });
}

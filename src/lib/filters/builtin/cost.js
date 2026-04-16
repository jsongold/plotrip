import L from 'leaflet';
import { registerFilter } from '../registry';
import { supabase } from '../../supabase';
import { minPopForZoom } from '../../../hooks/useCatalogLoader';

/**
 * Cost filter — 表示範囲内の catalog 都市に cost tier badge を pop up。
 *
 * - Tap cost icon → ON
 * - 現在の Map bounds + zoom から catalog_cities を絞って取得
 *   (useCatalogLoader と同じ minPopForZoom 閾値を流用)
 * - それら都市の cost_tier を city_scores から bulk fetch
 * - `maxBadgesForZoom(zoom)` が表示する badge 数の上限 (中心から近い順に N 件)
 * - zoomend / moveend で再フェッチ・再描画 (debounce 300ms)
 *
 * tier: 1=Cheap (green), 2=Standard (amber), 3+=Expensive (red), null=N/A
 */
registerFilter({
  slug: 'cost',
  label: 'コスト',
  icon: '💰',
  kind: 'layer',
  order: 40,
  mountLayer(map, ctx) {
    const { layerGroup } = ctx;

    let cancelled = false;
    let reqId = 0;
    let debounceTimer = null;

    const load = async () => {
      if (cancelled) return;
      const myReqId = ++reqId;
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      const maxN = maxBadgesForZoom(zoom);

      if (maxN <= 0) {
        layerGroup.clearLayers();
        console.log(`[cost] zoom=${zoom}, nothing to show`);
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
        console.warn('[cost] catalog_cities query error:', catErr.message);
        return;
      }

      const ids = (catalog || []).map((c) => c.id);
      if (ids.length === 0) {
        layerGroup.clearLayers();
        return;
      }

      const { data: scores, error: scoresErr } = await supabase
        .from('city_scores')
        .select('city_id, cost_tier')
        .in('city_id', ids);
      if (cancelled || myReqId !== reqId) return;
      if (scoresErr) {
        console.warn('[cost] city_scores fetch error:', scoresErr.message);
      }
      const idToTier = new Map((scores || []).map((r) => [r.city_id, r.cost_tier]));

      // 中心から近い順で maxN 件に絞る
      const center = map.getCenter();
      const sorted = (catalog || [])
        .map((c) => ({
          city: c,
          tier: idToTier.get(c.id) ?? null,
          dist: L.latLng(c.lat, c.lng).distanceTo(center),
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, maxN);

      layerGroup.clearLayers();
      for (const { city, tier } of sorted) {
        const { label, emoji, color } = tierToLevel(tier);
        const html = makeBadgeHtml(emoji, label, color);
        const icon = L.divIcon({
          className: 'cost-badge',
          html,
          iconSize: null,
          iconAnchor: [0, 44],
        });
        L.marker([city.lat, city.lng], {
          icon,
          interactive: false,
          keyboard: false,
          zIndexOffset: 500,
        }).addTo(layerGroup);
      }
      console.log(`[cost] zoom=${zoom}, showing ${sorted.length} badges (catalog=${catalog?.length ?? 0})`);
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
  },
});

/**
 * zoom を引数に badge 表示の最大件数を返す。
 * zoom out = 少、zoom in = 多。
 *
 * @param {number} zoom
 * @returns {number}
 */
function maxBadgesForZoom(zoom) {
  if (zoom <= 3) return 0;
  if (zoom <= 5) return 4;
  if (zoom <= 7) return 8;
  if (zoom <= 9) return 16;
  if (zoom <= 11) return 30;
  return 60;
}

function tierToLevel(tier) {
  if (tier === 1) return { label: 'Cheap',     emoji: '💸', color: '#10b981' };
  if (tier === 2) return { label: 'Standard',  emoji: '💰', color: '#f59e0b' };
  if (tier === 3 || tier === 4) return { label: 'Expensive', emoji: '💎', color: '#ef4444' };
  return { label: 'N/A', emoji: '❓', color: '#9ca3af' };
}

function makeBadgeHtml(emoji, label, color) {
  return (
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
}

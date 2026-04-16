import L from 'leaflet';
import { registerFilter } from '../registry';
import { supabase } from '../../supabase';

/**
 * 気候 filter
 * - kind: 'both'  (Map にヒートマップ的な円 + City に気温付与)
 * - mountLayer: 現在表示中の cities の lat/lng に対し、指定月の avg_high_c を
 *   色付き circleMarker で重ねる。データは city_monthly から bulk fetch
 * - applyToCity: CityRef が既に monthly を持っている前提、何もしない (fields.js の temp_high が既に表示)
 */
registerFilter({
  slug: 'climate',
  label: '気候',
  icon: '🌡️',
  kind: 'both',
  dependsOnMonth: true,
  order: 10,
  applyToCity(ref) {
    // CityRef は useCityMeta が既に monthly をロード済みなので noop
    // (fields.js の temp_high field が自動的に表示される)
    return ref;
  },
  mountLayer(map, ctx) {
    const { month, cities, layerGroup } = ctx;
    if (!cities || cities.length === 0) return () => {};

    let cancelled = false;

    (async () => {
      // cities の id は destinations.id (UUID)。city_monthly.city_id は
      // catalog_cities.id (integer) を参照するため、name 経由で int id を解決する。
      const names = cities.map((c) => c.name).filter(Boolean);
      if (names.length === 0) return;

      // Phase 1: exact match (case-sensitive)
      const { data: exactMatches } = await supabase
        .from('catalog_cities')
        .select('id,name')
        .in('name', names);
      if (cancelled) return;

      const nameToId = new Map((exactMatches || []).map((r) => [r.name, r.id]));

      // Phase 2: ilike fallback for any name still unresolved
      const unresolved = names.filter((n) => !nameToId.has(n));
      for (const n of unresolved) {
        const { data: m } = await supabase
          .from('catalog_cities')
          .select('id,name')
          .ilike('name', n)
          .limit(1);
        if (cancelled) return;
        if (m && m.length) nameToId.set(n, m[0].id);
      }

      console.log('[climate]', { month, destinations: names, resolved: Array.from(nameToId.entries()) });

      if (nameToId.size === 0) {
        console.warn('[climate] no catalog_cities matched for destinations:', names);
        return;
      }

      const integerIds = Array.from(new Set(Array.from(nameToId.values())));
      const { data, error } = await supabase
        .from('city_monthly')
        .select('city_id, avg_high_c')
        .in('city_id', integerIds)
        .eq('month', month);
      if (cancelled) return;
      if (error) {
        console.warn('[climate] city_monthly fetch error:', error.message);
        return;
      }

      console.log('[climate] monthly rows:', data);

      const idToTemp = new Map((data || []).map((r) => [r.city_id, r.avg_high_c]));

      let drawn = 0;
      let fallback = 0;
      for (const c of cities) {
        const cid = nameToId.get(c.name);
        const temp = cid != null ? idToTemp.get(cid) : null;
        const bounds = bboxPolygon(c.lat, c.lng);
        if (temp == null) {
          // データ無し destination: グレー破線 polygon
          L.polygon(bounds, {
            color: '#9ca3af',
            weight: 1.5,
            dashArray: '4,4',
            fillColor: '#d1d5db',
            fillOpacity: 0.2,
            interactive: false,
          }).addTo(layerGroup);
          fallback++;
          continue;
        }
        const color = climateColor(temp);
        L.polygon(bounds, {
          color,
          weight: 1.5,
          fillColor: color,
          fillOpacity: 0.35,
          interactive: false,
        }).addTo(layerGroup);
        drawn++;
      }
      console.log(`[climate] drew ${drawn} colored + ${fallback} gray polygons for month ${month}`);
    })();

    return () => {
      cancelled = true;
      layerGroup.clearLayers();
    };
  },
});

function climateColor(tempC) {
  // -10°C=青 → 10°C=緑 → 25°C=黄 → 35°C=赤
  if (tempC <= 0) return '#3b82f6';
  if (tempC <= 10) return '#10b981';
  if (tempC <= 20) return '#84cc16';
  if (tempC <= 28) return '#f59e0b';
  return '#ef4444';
}

/**
 * MVP 仮 Polygon: lat/lng を中心に 0.5° の bbox 四角。
 * 後日 catalog_cities.region_poly (GeoJSON) が入ったらここを差し替える。
 */
function bboxPolygon(lat, lng, halfDeg = 0.5) {
  return [
    [lat - halfDeg, lng - halfDeg],
    [lat - halfDeg, lng + halfDeg],
    [lat + halfDeg, lng + halfDeg],
    [lat + halfDeg, lng - halfDeg],
  ];
}

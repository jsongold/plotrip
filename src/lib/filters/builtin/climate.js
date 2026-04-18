/**
 * Climate filter — city_monthly.avg_high_c で指定月の気温をその都市のエリアに
 * **polygon で塗り分け**。5 温度レベル × 5 色。
 *
 * 現状は catalog_cities の lat/lng 中心に 0.5° bbox の仮 polygon を使う。
 * 将来 catalog_cities.climate_poly (GeoJSON) が入ったら makeBboxPolygon を
 * そこからの変換に差し替えるだけで対応可能。
 *
 * 依存:
 * - ../registry: registerFilter
 * - ../../supabase: supabase client
 * - ../badgeLayer: mountCatalogLayer + makeBboxPolygon
 *
 * DB:
 * - city_monthly(city_id integer, month smallint, avg_high_c real, ...)
 */
import L from 'leaflet';
import { registerFilter } from '../registry';
import { supabase } from '../../supabase';
import { mountCatalogLayer, makeBboxPolygon } from '../badgeLayer';

function makeTempLabel(city, tempC, color) {
  return L.marker([city.lat, city.lng], {
    interactive: false,
    icon: L.divIcon({
      className: '',
      html: `<div style="
        font-size:13px;font-weight:700;color:${color};
        text-shadow:0 0 3px #fff,0 0 3px #fff;
        white-space:nowrap;text-align:center;
      ">${Math.round(tempC)}°</div>`,
      iconSize: [36, 18],
      iconAnchor: [18, 9],
    }),
  });
}

function makeClimateShape(city, style) {
  if (city.climate_poly) {
    return L.geoJSON(city.climate_poly, {
      style: () => ({ weight: 1.2, fillOpacity: 0.4, interactive: false, ...style }),
    });
  }
  return makeBboxPolygon(city, style);
}

registerFilter({
  slug: 'climate',
  label: 'Temperature',
  icon: '🌡️',
  kind: 'layer',
  dependsOnMonth: true,
  order: 10,
  mountLayer(map, ctx) {
    return mountCatalogLayer(map, ctx, {
      slug: 'climate',
      async fetchExtra({ cityIds, month }) {
        const { data, error } = await supabase
          .from('city_monthly')
          .select('city_id, avg_high_c')
          .in('city_id', cityIds)
          .eq('month', month);
        if (error) throw error;
        return new Map((data || []).map((r) => [r.city_id, r.avg_high_c]));
      },
      draw(city, tempC) {
        if (tempC == null) {
          return makeClimateShape(city, {
            color: '#9ca3af',
            weight: 1,
            dashArray: '4,4',
            fillColor: '#d1d5db',
            fillOpacity: 0.15,
          });
        }
        const color = climateColor(tempC);
        const shape = makeClimateShape(city, {
          color,
          weight: 1.2,
          fillColor: color,
          fillOpacity: 0.4,
        });
        const label = makeTempLabel(city, tempC, color);
        return [shape, label];
      },
    });
  },
});

/**
 * 5 段階の気候カラー。
 *   ≤  0°C : Cold      (blue)
 *   ≤ 10°C : Cool      (teal)
 *   ≤ 20°C : Mild      (green)
 *   ≤ 28°C : Warm      (amber)
 *   >  28°C: Hot       (red)
 */
function climateColor(tempC) {
  if (tempC <= 0) return '#3b82f6';   // cold
  if (tempC <= 10) return '#06b6d4';  // cool
  if (tempC <= 20) return '#10b981';  // mild
  if (tempC <= 28) return '#f59e0b';  // warm
  return '#ef4444';                   // hot
}

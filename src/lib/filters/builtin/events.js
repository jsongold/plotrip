/**
 * Events filter — city_monthly.event_count で月別イベント数 badge。
 * event_count > 0 の都市のみ描画 (draw が null を返すと badgeLayer が skip)。
 * 密度は viewport-area ベース (mountCatalogLayer のデフォルト)。
 */
import { registerFilter } from '../registry';
import { supabase } from '../../supabase';
import { mountCatalogLayer, makeBadgeMarker } from '../badgeLayer';

registerFilter({
  slug: 'events',
  label: 'Events',
  icon: '🎉',
  kind: 'layer',
  dependsOnMonth: true,
  order: 50,
  mountLayer(map, ctx) {
    return mountCatalogLayer(map, ctx, {
      slug: 'events',
      async fetchExtra({ cityIds, month }) {
        const { data, error } = await supabase
          .from('city_monthly')
          .select('city_id, event_count')
          .in('city_id', cityIds)
          .eq('month', month);
        if (error) throw error;
        return new Map((data || []).map((r) => [r.city_id, r.event_count]));
      },
      draw(city, count) {
        if (count == null || count <= 0) return null; // skip
        const color = count >= 5 ? '#a855f7' : '#ec4899';
        return makeBadgeMarker(city, { label: `${count} events`, emoji: '🎉', color });
      },
    });
  },
});

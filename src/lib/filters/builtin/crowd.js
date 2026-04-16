/**
 * @file crowd.js
 * @description Crowd filter — city_monthly.crowd_index を月別に取得し、
 *              Quiet / Moderate / Busy の 3 段階 badge で表示。
 *              密度は viewport-area ベース (mountCatalogLayer のデフォルト)。
 */

import { registerFilter } from '../registry';
import { supabase } from '../../supabase';
import { mountCatalogLayer, makeBadgeMarker } from '../badgeLayer';

registerFilter({
  slug: 'crowd',
  label: 'Crowd',
  icon: '👥',
  kind: 'layer',
  dependsOnMonth: true,
  order: 30,
  mountLayer(map, ctx) {
    return mountCatalogLayer(map, ctx, {
      slug: 'crowd',
      async fetchExtra({ cityIds, month }) {
        const { data, error } = await supabase
          .from('city_monthly')
          .select('city_id, crowd_index')
          .in('city_id', cityIds)
          .eq('month', month);
        if (error) throw error;
        return new Map((data || []).map((r) => [r.city_id, r.crowd_index]));
      },
      draw(city, idx) {
        return makeBadgeMarker(city, idxToLevel(idx));
      },
    });
  },
});

function idxToLevel(idx) {
  if (idx == null) return { label: 'N/A', emoji: '❓', color: '#9ca3af' };
  // crowd_index は 0-100 の想定
  if (idx >= 66) return { label: 'Busy',     emoji: '👥', color: '#ef4444' };
  if (idx >= 33) return { label: 'Moderate', emoji: '👥', color: '#f59e0b' };
  return                { label: 'Quiet',    emoji: '👥', color: '#10b981' };
}

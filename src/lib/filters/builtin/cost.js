import { registerFilter } from '../registry';
import { supabase } from '../../supabase';
import { mountCatalogLayer, makeBadgeMarker } from '../badgeLayer';

/**
 * Cost filter — city_scores.cost_tier で Cheap/Standard/Expensive badge。
 * 密度は viewport-area ベース (mountCatalogLayer のデフォルト pxPerPin)。
 */
registerFilter({
  slug: 'cost',
  label: 'Cost',
  icon: '💰',
  kind: 'layer',
  order: 40,
  mountLayer(map, ctx) {
    return mountCatalogLayer(map, ctx, {
      slug: 'cost',
      async fetchExtra({ cityIds }) {
        const { data, error } = await supabase
          .from('city_scores')
          .select('city_id, cost_tier')
          .in('city_id', cityIds);
        if (error) throw error;
        return new Map((data || []).map((r) => [r.city_id, r.cost_tier]));
      },
      draw(city, tier) {
        return makeBadgeMarker(city, tierToLevel(tier));
      },
    });
  },
});

function tierToLevel(tier) {
  if (tier === 1) return { label: 'Cheap',     emoji: '💸', color: '#10b981' };
  if (tier === 2) return { label: 'Standard',  emoji: '💰', color: '#f59e0b' };
  if (tier === 3 || tier === 4) return { label: 'Expensive', emoji: '💎', color: '#ef4444' };
  return { label: 'N/A', emoji: '❓', color: '#9ca3af' };
}

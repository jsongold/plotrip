import { registerFilter } from '../registry';
import { supabase } from '../../supabase';

/**
 * Cost filter — city_scores.cost_tier を orbit segment として提供。
 * 複数 filter が同時 ON の時は unified orbit layer 側で都市ごとに集約。
 */
registerFilter({
  slug: 'cost',
  label: 'Cost',
  icon: '💰',
  kind: 'orbit',
  order: 40,
  async fetchSegmentData({ cityIds }) {
    const { data, error } = await supabase
      .from('city_scores')
      .select('city_id, cost_tier')
      .in('city_id', cityIds);
    if (error) throw error;
    return new Map((data || []).map((r) => [r.city_id, r.cost_tier]));
  },
  toSegment(tier) {
    if (tier === 1) return { emoji: '💸', color: '#10b981', label: 'Cheap' };
    if (tier === 2) return { emoji: '💰', color: '#f59e0b', label: 'Standard' };
    if (tier === 3 || tier === 4) return { emoji: '💎', color: '#ef4444', label: 'Expensive' };
    return null;
  },
});

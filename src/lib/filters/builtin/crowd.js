/**
 * Crowd filter — city_monthly.crowd_index (0-100) を orbit segment として提供。
 */
import { registerFilter } from '../registry';
import { supabase } from '../../supabase';

registerFilter({
  slug: 'crowd',
  label: 'Crowd',
  icon: '👥',
  kind: 'orbit',
  dependsOnMonth: true,
  order: 30,
  async fetchSegmentData({ cityIds, month }) {
    const { data, error } = await supabase
      .from('city_monthly')
      .select('city_id, crowd_index')
      .in('city_id', cityIds)
      .eq('month', month);
    if (error) throw error;
    return new Map((data || []).map((r) => [r.city_id, r.crowd_index]));
  },
  toSegment(idx) {
    if (idx == null) return null;
    if (idx >= 66) return { emoji: '👥', color: '#ef4444', label: 'Busy' };
    if (idx >= 33) return { emoji: '👥', color: '#f59e0b', label: 'Moderate' };
    return { emoji: '👥', color: '#10b981', label: 'Quiet' };
  },
});

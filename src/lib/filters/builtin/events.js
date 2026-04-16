/**
 * Events filter — city_monthly.event_count を orbit segment として提供。
 * event_count > 0 のみ segment 返却。
 */
import { registerFilter } from '../registry';
import { supabase } from '../../supabase';

registerFilter({
  slug: 'events',
  label: 'Events',
  icon: '🎉',
  kind: 'orbit',
  dependsOnMonth: true,
  order: 50,
  async fetchSegmentData({ cityIds, month }) {
    const { data, error } = await supabase
      .from('city_monthly')
      .select('city_id, event_count')
      .in('city_id', cityIds)
      .eq('month', month);
    if (error) throw error;
    return new Map((data || []).map((r) => [r.city_id, r.event_count]));
  },
  toSegment(count) {
    if (count == null || count <= 0) return null;
    const color = count >= 5 ? '#a855f7' : '#ec4899';
    return { emoji: '🎉', color, label: `${count} events` };
  },
});

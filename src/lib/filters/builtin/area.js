/**
 * Area filter — catalog_cities.area を orbit segment として提供。
 * value が指定されている場合は一致する area のみ segment を返す。
 */
import { registerFilter } from '../registry';
import { supabase } from '../../supabase';

const AREA_STYLES = {
  beach: { emoji: '🏖️', color: '#0891b2', label: 'Beach' },
  mountain: { emoji: '⛰️', color: '#737373', label: 'Mountain' },
  town: { emoji: '🏙️', color: '#6366f1', label: 'Town' },
};

registerFilter({
  slug: 'area',
  label: 'Area',
  icon: '🗺',
  kind: 'orbit',
  order: 60,
  options: [
    { value: 'beach', label: 'Beach' },
    { value: 'mountain', label: 'Mountain' },
    { value: 'town', label: 'Town' },
  ],
  async fetchSegmentData({ cityIds }) {
    const { data, error } = await supabase
      .from('catalog_cities')
      .select('id, area')
      .in('id', cityIds);
    if (error) throw error;
    return new Map((data || []).map((r) => [r.id, r.area]));
  },
  toSegment(area, { value } = {}) {
    if (!area) return null;
    if (value && value !== area) return null;
    return AREA_STYLES[area] || null;
  },
});

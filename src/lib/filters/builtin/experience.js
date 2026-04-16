/**
 * Experience filter — catalog_cities.experiences を orbit segment として提供。
 * value 指定時は一致するものだけ、未指定時は先頭 experience を segment 化。
 */
import { registerFilter } from '../registry';
import { supabase } from '../../supabase';

const EXPERIENCE_STYLES = {
  party: { emoji: '🎉', color: '#a855f7', label: 'Party' },
  beach: { emoji: '🏖️', color: '#0891b2', label: 'Beach' },
  hiking: { emoji: '🥾', color: '#059669', label: 'Hiking' },
  architecture: { emoji: '🏛️', color: '#737373', label: 'Architecture' },
  food: { emoji: '🍜', color: '#f97316', label: 'Food' },
  winter_sport: { emoji: '⛷️', color: '#0ea5e9', label: 'Winter sport' },
  swimming: { emoji: '🏊', color: '#06b6d4', label: 'Swimming' },
};

registerFilter({
  slug: 'experience',
  label: 'Experience',
  icon: '🎯',
  kind: 'orbit',
  order: 70,
  options: [
    { value: 'party', label: 'Party' },
    { value: 'beach', label: 'Beach' },
    { value: 'hiking', label: 'Hiking' },
    { value: 'architecture', label: 'Architecture' },
    { value: 'food', label: 'Food' },
    { value: 'winter_sport', label: 'Winter sport' },
    { value: 'swimming', label: 'Swimming' },
  ],
  async fetchSegmentData({ cityIds }) {
    const { data, error } = await supabase
      .from('catalog_cities')
      .select('id, experiences')
      .in('id', cityIds)
      .not('experiences', 'is', null)
      .filter('experiences', 'not.eq', '{}');
    if (error) throw error;
    return new Map(
      (data || [])
        .filter((r) => Array.isArray(r.experiences) && r.experiences.length > 0)
        .map((r) => [r.id, r.experiences])
    );
  },
  toSegment(experiences, { value } = {}) {
    if (!experiences || experiences.length === 0) return null;
    if (value) {
      if (!experiences.includes(value)) return null;
      return EXPERIENCE_STYLES[value] || null;
    }
    const first = experiences[0];
    return EXPERIENCE_STYLES[first] || null;
  },
});

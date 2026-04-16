/**
 * Vibes filter — city_tags から weight 最大 tag を orbit segment として提供。
 */
import { registerFilter } from '../registry';
import { supabase } from '../../supabase';

const VIBE_CATEGORIES = {
  party:  { tags: ['nightlife'],                   emoji: '🎉', color: '#a855f7', label: 'Party' },
  quiet:  { tags: ['nature', 'outdoors', 'history'], emoji: '🌿', color: '#10b981', label: 'Quiet' },
  noisy:  { tags: ['shopping', 'food', 'culture'],   emoji: '🔊', color: '#ef4444', label: 'Noisy' },
};

registerFilter({
  slug: 'vibes',
  label: 'Vibes',
  icon: '✨',
  kind: 'orbit',
  order: 20,
  options: [
    { value: 'party', label: 'Party' },
    { value: 'quiet', label: 'Quiet' },
    { value: 'noisy', label: 'Noisy' },
  ],
  async fetchSegmentData({ cityIds }) {
    const { data, error } = await supabase
      .from('city_tags')
      .select('city_id, tag, weight')
      .in('city_id', cityIds)
      .order('weight', { ascending: false });
    if (error) throw error;
    const topTag = new Map();
    for (const row of (data || [])) {
      if (!topTag.has(row.city_id)) topTag.set(row.city_id, row.tag);
    }
    return topTag;
  },
  toSegment(tag, { value } = {}) {
    if (!tag) return null;
    if (value) {
      const cat = VIBE_CATEGORIES[value];
      if (!cat) return null;
      if (!cat.tags.includes(tag)) return null;
      return { emoji: cat.emoji, color: cat.color, label: cat.label };
    }
    const style = tagStyle(tag);
    return { emoji: style.emoji, color: style.color, label: tag };
  },
});

function tagStyle(tag) {
  const map = {
    food:      { emoji: '🍜', color: '#f97316' },
    nightlife: { emoji: '🌃', color: '#a855f7' },
    culture:   { emoji: '🎭', color: '#0ea5e9' },
    history:   { emoji: '🏛️', color: '#737373' },
    nature:    { emoji: '🌿', color: '#10b981' },
    outdoors:  { emoji: '🏞️', color: '#059669' },
    beach:     { emoji: '🏖️', color: '#0891b2' },
    photogenic:{ emoji: '📸', color: '#e11d48' },
    art:       { emoji: '🎨', color: '#8b5cf6' },
    shopping:  { emoji: '🛍️', color: '#ec4899' },
  };
  return map[tag] ?? { emoji: '✨', color: '#6366f1' };
}

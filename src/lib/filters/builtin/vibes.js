/**
 * @file src/lib/filters/builtin/vibes.js
 * Vibes filter — city_tags から各都市の weight 最大 tag を取得し、badge 表示。
 * 密度は viewport-area ベース (mountCatalogLayer のデフォルト)。
 */
import { registerFilter } from '../registry';
import { supabase } from '../../supabase';
import { mountCatalogLayer, makeBadgeMarker } from '../badgeLayer';

registerFilter({
  slug: 'vibes',
  label: 'バイブス',
  icon: '✨',
  kind: 'layer',
  order: 20,
  mountLayer(map, ctx) {
    return mountCatalogLayer(map, ctx, {
      slug: 'vibes',
      async fetchExtra({ cityIds }) {
        const { data, error } = await supabase
          .from('city_tags')
          .select('city_id, tag, weight')
          .in('city_id', cityIds)
          .order('weight', { ascending: false });
        if (error) throw error;
        // city_id -> top tag (weight 降順の最初)
        const map = new Map();
        for (const row of (data || [])) {
          if (!map.has(row.city_id)) map.set(row.city_id, row.tag);
        }
        return map;
      },
      draw(city, tag) {
        if (!tag) return makeBadgeMarker(city, { label: '—', emoji: '✨', color: '#9ca3af' });
        const { emoji, color } = tagStyle(tag);
        return makeBadgeMarker(city, { label: tag, emoji, color });
      },
    });
  },
});

function tagStyle(tag) {
  // 頻出 tag に固有 emoji/color を、それ以外はデフォルト
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

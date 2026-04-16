import { registerFilter } from '../registry';

registerFilter({
  slug: 'vibes',
  label: 'バイブス',
  icon: '✨',
  kind: 'meta',
  order: 20,
  applyToCity(ref) {
    // TODO(F2-step2): city_tags を CityRef.tags に流す。現在は useCityMeta が既に tags を取得済み
    return ref;
  },
});

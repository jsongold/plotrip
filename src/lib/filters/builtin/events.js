import { registerFilter } from '../registry';

registerFilter({
  slug: 'events',
  label: 'イベント',
  icon: '🎉',
  kind: 'both',
  dependsOnMonth: true,
  order: 50,
  applyToCity(ref) {
    return ref;
  },
  mountLayer(map, ctx) {
    return () => {};
  },
});

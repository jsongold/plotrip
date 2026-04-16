import { registerFilter } from '../registry';

registerFilter({
  slug: 'crowd',
  label: '混雑',
  icon: '👥',
  kind: 'both',
  dependsOnMonth: true,
  order: 30,
  applyToCity(ref) {
    // TODO(F2-step2): crowd_index で表示
    return ref;
  },
  mountLayer(map, ctx) {
    // TODO(F2-step2): circle marker サイズ変調
    return () => {};
  },
});

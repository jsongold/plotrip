import { registerFilter } from '../registry';

registerFilter({
  slug: 'cost',
  label: 'コスト',
  icon: '💰',
  kind: 'meta',
  order: 40,
  applyToCity(ref) {
    // TODO(F2-step2): cost_tier 表示強化
    return ref;
  },
});

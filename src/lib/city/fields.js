/**
 * City field registry.
 *
 * 表示用フィールドのレジストリ。Supabase に新カラムが追加されたとき、
 * UI に表示するにはこのファイルに `registerField({...})` を 1 行追加するだけで
 * CityPinPopup / CityCard などに自動反映される。
 *
 * @typedef {import('./CityRef.js').CityRef} CityRef
 *
 * @typedef {'pinMeta' | 'pinTag' | 'cardStat' | 'cardRadar'} FieldSlot
 *
 * @typedef {Object} FieldDefinition
 * @property {string}                                key     - unique ID
 * @property {string}                                label   - 表示用ラベル
 * @property {(ref: CityRef, ctx: { month?: number }) => any} source - CityRef から値を取り出す
 * @property {(value: any) => (string | null)}      format  - 表示文字列に変換。null を返すと非表示
 * @property {FieldSlot}                             slot    - どの UI 領域に表示するか
 * @property {number}                                [order] - 表示順 (省略時 100)
 */

/** @type {Map<string, FieldDefinition>} */
const registry = new Map();

/**
 * フィールド定義を登録する。同じ key で再登録されたら上書き (dev safe)。
 *
 * @param {FieldDefinition} definition
 * @returns {FieldDefinition} 正規化された定義
 */
export function registerField(definition) {
  if (!definition || typeof definition !== 'object') {
    throw new Error('registerField: definition must be an object');
  }
  const { key, label, source, format, slot } = definition;
  if (!key || typeof key !== 'string') {
    throw new Error('registerField: `key` is required (string)');
  }
  if (typeof source !== 'function') {
    throw new Error(`registerField(${key}): \`source\` must be a function`);
  }
  if (typeof format !== 'function') {
    throw new Error(`registerField(${key}): \`format\` must be a function`);
  }
  if (!slot || typeof slot !== 'string') {
    throw new Error(`registerField(${key}): \`slot\` is required (string)`);
  }
  const normalized = {
    key,
    label: label ?? key,
    source,
    format,
    slot,
    order: Number.isFinite(definition.order) ? definition.order : 100,
  };
  registry.set(key, normalized);
  return normalized;
}

/**
 * 指定 slot のフィールド配列を order 昇順で返す。
 *
 * @param {FieldSlot} slot
 * @returns {FieldDefinition[]}
 */
export function forSlot(slot) {
  const list = [];
  for (const def of registry.values()) {
    if (def.slot === slot) list.push(def);
  }
  list.sort((a, b) => a.order - b.order);
  return list;
}

/**
 * CityRef からフィールドを評価して表示用オブジェクトを返す。
 * source または format が null/undefined を返した場合は null を返す (= 非表示)。
 *
 * @param {CityRef} ref
 * @param {FieldDefinition} field
 * @param {{ month?: number }} [ctx]
 * @returns {{ key: string, label: string, text: string } | null}
 */
export function renderField(ref, field, ctx) {
  if (!ref || !field) return null;
  let value;
  try {
    value = field.source(ref, ctx || {});
  } catch {
    return null;
  }
  if (value == null) return null;
  let text;
  try {
    text = field.format(value);
  } catch {
    return null;
  }
  if (text == null) return null;
  return { key: field.key, label: field.label, text };
}

// ---------------------------------------------------------------------------
// 初期フィールド登録
// ---------------------------------------------------------------------------

registerField({
  key: 'temp_high',
  label: '最高気温',
  source: (ref, ctx) => ref.get(`monthly.${ctx?.month ?? new Date().getMonth() + 1}.avg_high_c`),
  format: (v) => v == null ? null : `${Math.round(v)}°C`,
  slot: 'pinMeta',
  order: 10,
});

registerField({
  key: 'cost_tier',
  label: 'コスト',
  source: (ref) => ref.get('scores.cost_tier') ?? ref.get('cost_tier'),
  format: (v) => v == null ? null : '$'.repeat(Math.max(1, Math.min(4, v))),
  slot: 'pinMeta',
  order: 20,
});

registerField({
  key: 'safety',
  label: 'safety',
  source: (ref) => ref.get('scores.safety') ?? ref.get('safety'),
  format: (v) => v == null ? null : `safety ${v}`,
  slot: 'pinMeta',
  order: 30,
});

registerField({
  key: 'crowd_index',
  label: '混雑',
  source: (ref, ctx) => ref.get(`monthly.${ctx?.month ?? new Date().getMonth() + 1}.crowd_index`),
  format: (v) => v == null ? null : `crowd ${Math.round(v)}`,
  slot: 'pinMeta',
  order: 40,
});

registerField({
  key: 'top_tags',
  label: 'タグ',
  source: (ref) => {
    const tags = ref.get('tags', []);
    if (Array.isArray(tags) && tags.length) return tags.slice(0, 4).map(t => t.tag || t);
    const top = ref.get('top_tags');
    return Array.isArray(top) ? top.slice(0, 4) : [];
  },
  format: (v) => Array.isArray(v) && v.length ? v.join(' · ') : null,
  slot: 'pinTag',
  order: 10,
});

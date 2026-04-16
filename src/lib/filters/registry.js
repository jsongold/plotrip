/**
 * @typedef {import('../city/CityRef').CityRef} CityRef
 *
 * @typedef {'meta'|'layer'|'orbit'|'both'} FilterKind
 *
 * @typedef {Object} FilterDefinition
 * @property {string} slug                       - unique ID ('climate', 'vibes'...)
 * @property {string} label                      - 表示ラベル
 * @property {any} icon                          - JSX SVG や文字列
 * @property {FilterKind} kind
 * @property {boolean} [dependsOnMonth]
 * @property {(ref: CityRef, ctx: { month: number }) => CityRef} [applyToCity]
 * @property {(map: any, ctx: { month: number, cities?: Array }) => (() => void)} [mountLayer]
 * @property {(args: {cityIds:number[], month:number}) => Promise<Map<number, any>>} [fetchSegmentData]
 * @property {(extra: any) => ({emoji:string,color:string,label?:string}|null)} [toSegment]
 * @property {number} [order]                    - 表示順 (省略時 100)
 */

/** @type {Map<string, FilterDefinition>} */
const registry = new Map();

export function registerFilter(def) {
  if (!def || !def.slug) throw new Error('registerFilter: slug required');
  const normalized = {
    kind: 'meta',
    dependsOnMonth: false,
    order: 100,
    ...def,
  };
  registry.set(def.slug, normalized);
  return normalized;
}

export function getAllFilters() {
  return Array.from(registry.values()).sort((a, b) => a.order - b.order);
}

export function getFilter(slug) {
  return registry.get(slug) ?? null;
}

export function getLayerFilters() {
  return getAllFilters().filter((f) => f.kind === 'layer' || f.kind === 'both');
}

export function getMetaFilters() {
  return getAllFilters().filter((f) => f.kind === 'meta' || f.kind === 'both');
}

export function getOrbitFilters() {
  return getAllFilters().filter(
    (f) => f.kind === 'orbit' && typeof f.fetchSegmentData === 'function' && typeof f.toSegment === 'function'
  );
}

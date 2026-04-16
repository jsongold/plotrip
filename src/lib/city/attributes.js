/**
 * @file src/lib/city/attributes.js
 *
 * `city_attributes` (key-value jsonb) を扱う薄いヘルパー。
 * CityRef.attrs に流し込む Map を生成する／jsonb value を軽く型キャストする。
 *
 * 想定される呼び出し例:
 *   import { toAttrsMap, coerceAttr } from '@/lib/city/attributes'
 *
 *   const rows = await supabase.from('city_attributes')
 *     .select('key, value').eq('city_id', 42)
 *   const attrs = toAttrsMap(rows.data)
 *   //   => Map { 'vibes' => ['chill','foodie'], 'wifi_mbps' => 85, ... }
 *
 *   const wifi = coerceAttr(attrs.get('wifi_mbps'), 'number')  // 85
 *   const hasMetro = coerceAttr(attrs.get('has_metro'), 'boolean') // true/false
 */

/**
 * @typedef {Object} CityAttributeRow
 * @property {string} key
 * @property {*} value  - jsonb (任意の JSON 値)
 */

/**
 * @typedef {'number'|'string'|'boolean'} CoerceType
 */

/**
 * city_attributes 行配列を Map に変換する。value は jsonb のまま保持。
 *
 * @param {Array<CityAttributeRow>} rows
 * @returns {Map<string, *>}
 */
export function toAttrsMap(rows) {
  const map = new Map()
  if (!Array.isArray(rows)) return map
  for (const row of rows) {
    if (!row || typeof row.key !== 'string') continue
    map.set(row.key, row.value)
  }
  return map
}

/**
 * jsonb value を呼び出し側が必要とする型に軽くキャストする。
 * type 未指定ならそのまま返す。
 *
 * - 'number': `Number(value)` (NaN はそのまま返す)
 * - 'string': `String(value)`
 * - 'boolean': truthy 判定。ただし文字列 'false' / '0' は false 扱い。
 *
 * @param {*} value
 * @param {CoerceType} [type]
 * @returns {*}
 */
export function coerceAttr(value, type) {
  if (type === undefined || type === null) return value

  if (type === 'number') {
    if (value === null || value === undefined || value === '') return value
    return Number(value)
  }

  if (type === 'string') {
    if (value === null || value === undefined) return value
    return String(value)
  }

  if (type === 'boolean') {
    if (typeof value === 'string') {
      const s = value.trim().toLowerCase()
      if (s === 'false' || s === '0' || s === '') return false
      return true
    }
    return Boolean(value)
  }

  return value
}

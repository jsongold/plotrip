/**
 * @file src/lib/city/CityRef.js
 *
 * Pure-JS factory for a unified `CityRef` object.
 *
 * Supabase テーブル (`city_scores`, `city_monthly`, `city_attributes`, `city_tags`)
 * に今後カラムが追加されても壊れないよう、生データは `raw` に保持しつつ
 * 正規化されたアクセサ (`get`, `set`) を提供する。
 *
 * 想定される呼び出し例:
 *   import { createCityRef } from '@/lib/city/CityRef'
 *
 *   // catalog 行から
 *   const ref = createCityRef(catalogRow, { source: 'catalog' })
 *
 *   // discover RPC 戻り値から
 *   const ref = createCityRef(discoverRow, { source: 'discover' })
 *   ref.get('match_score')            // -> number
 *   ref.get('scores.safety', 0)       // -> 0 (まだ set されていない)
 *
 *   // useCityMeta が後から流し込む
 *   ref.set({
 *     scores: scoresRow,
 *     monthly: monthlyRows,           // Array<row>
 *     tags: tagRows,
 *     attrs: attrsMap,
 *   })
 *
 *   ref.get('monthly.7.avg_high_c')   // -> 28.5
 *   ref.get('attrs.vibes', [])        // -> jsonb value or []
 */

/**
 * @typedef {Object} CityRef
 * @property {number|null} id           - catalog_cities.id または discover.city_id
 * @property {string} name              - 都市名
 * @property {string|null} country      - ISO 国名 / 国コード
 * @property {number|null} lat
 * @property {number|null} lng
 * @property {Object} scores            - city_scores 行 (key-value)。初期 {}
 * @property {Map<number, Object>} monthly - month(1-12) -> city_monthly 行
 * @property {Array<{tag: string, weight: number}>} tags - city_tags 行
 * @property {Map<string, *>} attrs     - city_attributes (key -> jsonb)
 * @property {Object} raw               - 生データ保持 (新カラムのエスケープハッチ)
 * @property {(path: string, fallback?: *) => *} get - dot-path アクセサ
 * @property {(subset: CitySubset) => CityRef} set   - 追加データの流し込み
 */

/**
 * @typedef {Object} CitySubset
 * @property {Object} [scores]
 * @property {Map<number, Object>|Array<Object>} [monthly]
 * @property {Array<{tag: string, weight: number}>} [tags]
 * @property {Map<string, *>|Object} [attrs]
 */

/**
 * @typedef {'catalog'|'destination'|'discover'|'minimal'} CitySource
 */

/**
 * Discover RPC のトップレベルキー。get() でショートカット解決する。
 */
const DISCOVER_TOP_KEYS = new Set([
  'match_score',
  'reason_chips',
  'cover_photo_url',
  'avg_high_c',
  'crowd_index',
  'event_count',
  'safety',
  'cost_tier',
  'language_ease',
  'top_tags',
  'visitor_mix',
])

/**
 * 数値化ヘルパー (null/undefined/'' は null)
 * @param {*} v
 * @returns {number|null}
 */
function num(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * CityRef ファクトリ。
 *
 * @param {Object} raw - catalog_cities / destinations / discover RPC / 最小形式の行
 * @param {{ source?: CitySource }} [opts]
 * @returns {CityRef}
 */
export function createCityRef(raw, opts = {}) {
  const r = raw || {}
  const source = opts.source ?? null

  const ref = /** @type {CityRef} */ ({
    id: r.id ?? r.city_id ?? null,
    name: r.name ?? '',
    country: r.country ?? null,
    lat: num(r.lat),
    lng: num(r.lng),
    scores: {},
    monthly: new Map(),
    tags: [],
    attrs: new Map(),
    raw: { ...r, __source: source },

    /**
     * dot-path アクセサ。
     * 対応パターン:
     *   'scores.<key>'
     *   'monthly.<month>.<key>'
     *   'attrs.<key>'
     *   'tags'
     *   discover top-level key (e.g. 'match_score')
     *   その他: raw[path] をフォールバック参照
     *
     * @param {string} path
     * @param {*} [fallback]
     */
    get(path, fallback) {
      if (!path) return fallback
      if (path === 'tags') return this.tags.length ? this.tags : (fallback ?? this.tags)

      const parts = path.split('.')
      const head = parts[0]

      if (head === 'scores') {
        const key = parts[1]
        if (!key) return this.scores
        const v = this.scores?.[key]
        return v ?? fallback
      }

      if (head === 'monthly') {
        const month = Number(parts[1])
        const row = this.monthly.get(month)
        if (!row) return fallback
        const key = parts[2]
        if (!key) return row
        return row[key] ?? fallback
      }

      if (head === 'attrs') {
        const key = parts[1]
        if (!key) return this.attrs
        const v = this.attrs.get(key)
        return v ?? fallback
      }

      // discover RPC 由来のトップレベルキー
      if (DISCOVER_TOP_KEYS.has(head)) {
        const v = this.raw?.[head]
        return v ?? fallback
      }

      // 最終フォールバック: raw 直参照 (新カラム対応)
      const v = this.raw?.[head]
      return v ?? fallback
    },

    /**
     * 追加データの流し込み。useCityMeta が呼ぶ想定。
     * @param {CitySubset} subset
     * @returns {CityRef}
     */
    set(subset) {
      if (!subset) return this
      if (subset.scores) {
        this.scores = { ...this.scores, ...subset.scores }
      }
      if (subset.monthly) {
        if (subset.monthly instanceof Map) {
          this.monthly = subset.monthly
        } else if (Array.isArray(subset.monthly)) {
          this.monthly = new Map(
            subset.monthly
              .filter((row) => row && row.month != null)
              .map((row) => [Number(row.month), row])
          )
        }
      }
      if (subset.tags && Array.isArray(subset.tags)) {
        this.tags = subset.tags
      }
      if (subset.attrs) {
        if (subset.attrs instanceof Map) {
          this.attrs = subset.attrs
        } else if (typeof subset.attrs === 'object') {
          this.attrs = new Map(Object.entries(subset.attrs))
        }
      }
      return this
    },
  })

  return ref
}

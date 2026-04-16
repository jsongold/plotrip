/**
 * @file src/hooks/useCityMeta.js
 *
 * `useCityMeta` React フック。
 *
 * cityId (number) / plain city object / CityRef のいずれを渡しても
 * CityRef に正規化し、Supabase から city_monthly / city_tags / city_scores /
 * city_attributes を並列フェッチして流し込む。
 *
 * - monthly は全月取得 (month 切替時の再フェッチを回避)
 * - LRU キャッシュ (module-level, max 100) で同一 cityId×include の重複 fetch を抑止
 * - エラーは console.warn のみで握り潰し、空の CityRef を返す
 *
 * 使用例:
 *   const ref = useCityMeta(cityId, { month: 7 })
 *   const hi = ref.get('monthly.7.avg_high_c')
 *   const safety = ref.get('scores.safety')
 */

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createCityRef } from '../lib/city/CityRef'
import { toAttrsMap } from '../lib/city/attributes'

const LRU_MAX = 100
/** @type {Map<string, import('../lib/city/CityRef').CityRef>} */
const cache = new Map()

function cacheGet(key) {
  if (!cache.has(key)) return undefined
  const val = cache.get(key)
  // LRU: 参照時に末尾へ移動
  cache.delete(key)
  cache.set(key, val)
  return val
}

function cacheSet(key, val) {
  if (cache.has(key)) cache.delete(key)
  cache.set(key, val)
  while (cache.size > LRU_MAX) {
    const oldest = cache.keys().next().value
    if (oldest === undefined) break
    cache.delete(oldest)
  }
}

/**
 * 入力を CityRef に正規化する。CityRef っぽければそのまま、plain obj なら包む、
 * 数値なら最小形式で包む。
 */
function normalizeInput(input) {
  if (input == null) return null
  if (typeof input === 'number') {
    return createCityRef({ id: input }, { source: 'minimal' })
  }
  if (typeof input === 'object') {
    // CityRef shape 判定: get / set を持っていればそのまま
    if (typeof input.get === 'function' && typeof input.set === 'function') {
      return input
    }
    return createCityRef(input)
  }
  return null
}

const DEFAULT_INCLUDE = ['monthly', 'tags', 'scores', 'attrs']

/**
 * @param {number|Object} cityIdOrRef
 * @param {{ month?: number, include?: Array<'monthly'|'tags'|'scores'|'attrs'> }} [opts]
 * @returns {import('../lib/city/CityRef').CityRef}
 */
export function useCityMeta(cityIdOrRef, opts = {}) {
  const { month = new Date().getMonth() + 1, include = DEFAULT_INCLUDE } = opts

  const initialRef = useMemo(
    () => normalizeInput(cityIdOrRef) ?? createCityRef({}, { source: 'minimal' }),
    // cityIdOrRef の id/name 変化のみを見る
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      typeof cityIdOrRef === 'number' ? cityIdOrRef : cityIdOrRef?.id ?? null,
      typeof cityIdOrRef === 'object' ? cityIdOrRef?.name ?? null : null,
    ]
  )

  const includeKey = useMemo(() => {
    const norm = Array.isArray(include) ? [...include].sort().join(',') : ''
    return norm
  }, [include])

  const [ref, setRef] = useState(initialRef)

  // 入力が変わったら state をリセット
  useEffect(() => {
    setRef(initialRef)
  }, [initialRef])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!initialRef) return
      let cityId = initialRef.id ?? null
      const name = initialRef.name ?? null

      // name のみの場合は catalog_cities から解決
      if (cityId == null && name) {
        try {
          const { data } = await supabase
            .from('catalog_cities')
            .select('id')
            .ilike('name', name)
            .limit(1)
            .maybeSingle()
          cityId = data?.id ?? null
          if (cityId != null) initialRef.id = cityId
        } catch (err) {
          console.warn('[useCityMeta] name resolve failed:', err?.message || err)
        }
      }

      if (cancelled || cityId == null) return

      const cacheKey = `${cityId}:${includeKey}`
      const hit = cacheGet(cacheKey)
      if (hit) {
        if (!cancelled) setRef(hit)
        return
      }

      const wants = new Set(Array.isArray(include) ? include : DEFAULT_INCLUDE)
      const tasks = []

      tasks.push(
        wants.has('monthly')
          ? supabase.from('city_monthly').select('*').eq('city_id', cityId)
          : Promise.resolve({ data: null })
      )
      tasks.push(
        wants.has('tags')
          ? supabase
              .from('city_tags')
              .select('tag,weight')
              .eq('city_id', cityId)
              .order('weight', { ascending: false })
              .limit(4)
          : Promise.resolve({ data: null })
      )
      tasks.push(
        wants.has('scores')
          ? supabase.from('city_scores').select('*').eq('city_id', cityId).maybeSingle()
          : Promise.resolve({ data: null })
      )
      tasks.push(
        wants.has('attrs')
          ? supabase
              .from('city_attributes')
              .select('key,value')
              .eq('city_id', cityId)
              .then(
                (r) => r,
                (e) => {
                  console.warn('[useCityMeta] attrs fetch failed:', e?.message || e)
                  return { data: null, error: e }
                }
              )
          : Promise.resolve({ data: null })
      )

      let results
      try {
        results = await Promise.all(tasks)
      } catch (err) {
        console.warn('[useCityMeta] fetch failed:', err?.message || err)
        return
      }
      if (cancelled) return

      const [monthlyRes, tagsRes, scoresRes, attrsRes] = results
      const subset = {}
      if (wants.has('monthly') && Array.isArray(monthlyRes?.data)) {
        subset.monthly = monthlyRes.data
      }
      if (wants.has('tags') && Array.isArray(tagsRes?.data)) {
        subset.tags = tagsRes.data
      }
      if (wants.has('scores') && scoresRes?.data) {
        subset.scores = scoresRes.data
      }
      if (wants.has('attrs')) {
        // テーブル不在 (PGRST106 等) は toAttrsMap(null) で空 Map
        const attrsRows = Array.isArray(attrsRes?.data) ? attrsRes.data : []
        subset.attrs = toAttrsMap(attrsRows)
      }

      initialRef.set(subset)
      cacheSet(cacheKey, initialRef)
      if (!cancelled) setRef(initialRef)
    }

    run()
    return () => {
      cancelled = true
    }
    // month は fetch key に含めない (monthly 全月保持)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRef, includeKey])

  // month は利用側が get('monthly.<month>.*') で参照するだけなので依存不要だが、
  // React のルールに沿ってダミー依存に入れずに済むよう void で参照だけしておく
  void month

  return ref
}

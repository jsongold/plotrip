import { createContext, useContext, useState, useCallback, useMemo } from 'react';

/**
 * @typedef {Object} FilterContextValue
 * @property {Set<string>} activeFilters  - 有効化されている filter slug
 * @property {Map<string, string>} filterValues - slug -> 選択された option value (cost 等 selection 型用)
 * @property {number} month               - 1-12
 * @property {(slug: string) => void} toggle
 * @property {(month: number) => void} setMonth
 * @property {(slug: string) => boolean} isActive
 * @property {(slug: string, value: string|null) => void} setFilterValue - null で削除
 * @property {(slug: string) => string|undefined} getFilterValue
 */

const FilterContext = createContext(/** @type {FilterContextValue|null} */ (null));

export function FilterProvider({ children, initialMonth }) {
  const [activeFilters, setActiveFilters] = useState(() => new Set());
  const [filterValues, setFilterValues] = useState(() => new Map());
  const [month, setMonth] = useState(initialMonth ?? (new Date().getMonth() + 1));

  const toggle = useCallback((slug) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  const isActive = useCallback((slug) => activeFilters.has(slug), [activeFilters]);

  const setFilterValue = useCallback((slug, value) => {
    setFilterValues((prev) => {
      const next = new Map(prev);
      if (value == null) next.delete(slug);
      else next.set(slug, value);
      return next;
    });
  }, []);

  const getFilterValue = useCallback((slug) => filterValues.get(slug), [filterValues]);

  const value = useMemo(
    () => ({ activeFilters, filterValues, month, toggle, setMonth, isActive, setFilterValue, getFilterValue }),
    [activeFilters, filterValues, month, toggle, isActive, setFilterValue, getFilterValue]
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

/**
 * @returns {FilterContextValue}
 */
export function useFilter() {
  const ctx = useContext(FilterContext);
  if (!ctx) {
    // Provider の外で呼ばれたらno-opを返す (DiscoverPage等で落ちないため)
    return {
      activeFilters: new Set(),
      filterValues: new Map(),
      month: new Date().getMonth() + 1,
      toggle: () => {},
      setMonth: () => {},
      isActive: () => false,
      setFilterValue: () => {},
      getFilterValue: () => undefined,
    };
  }
  return ctx;
}

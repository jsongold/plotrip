import { createContext, useContext, useState, useCallback, useMemo } from 'react';

/**
 * @typedef {Object} FilterContextValue
 * @property {Set<string>} activeFilters  - 有効化されている filter slug
 * @property {number} month               - 1-12
 * @property {(slug: string) => void} toggle
 * @property {(month: number) => void} setMonth
 * @property {(slug: string) => boolean} isActive
 */

const FilterContext = createContext(/** @type {FilterContextValue|null} */ (null));

export function FilterProvider({ children, initialMonth }) {
  const [activeFilters, setActiveFilters] = useState(() => new Set());
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

  const value = useMemo(
    () => ({ activeFilters, month, toggle, setMonth, isActive }),
    [activeFilters, month, toggle, isActive]
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
      month: new Date().getMonth() + 1,
      toggle: () => {},
      setMonth: () => {},
      isActive: () => false,
    };
  }
  return ctx;
}

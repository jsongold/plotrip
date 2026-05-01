import { useState, useMemo, useCallback } from 'react';

export function useFocusedCity(cities) {
  const [focusedId, setFocusedIdState] = useState(null);

  const focusedIndex = useMemo(() => {
    if (focusedId != null) {
      const idx = cities.findIndex((c) => c.id === focusedId);
      if (idx >= 0) return idx;
    }
    return cities.length > 0 ? cities.length - 1 : null;
  }, [cities, focusedId]);

  const setFocusedId = useCallback((id) => {
    setFocusedIdState(id ?? null);
  }, []);

  const setFocusedByIndex = useCallback(
    (idx) => {
      if (idx == null || idx < 0 || idx >= cities.length) return;
      setFocusedIdState(cities[idx]?.id ?? null);
    },
    [cities]
  );

  return { focusedIndex, focusedId, setFocusedId, setFocusedByIndex };
}

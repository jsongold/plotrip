import { useEffect, useRef, useState, useMemo } from 'react';
import { SuggestionItem } from './suggestion/SuggestionItem';
import { useFilter } from '../context/FilterContext';
import { discover } from '../lib/discover';
import { bump } from '../lib/haptics';

export function CitySuggestionCarousel({ origin, onClose, onFocusCity, onAddCity, onSuggest, suggestionOption }) {
  const { activeFilters, filterValues, month } = useFilter();
  const [candidates, setCandidates] = useState(null);
  const [fetchError, setFetchError] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollerRef = useRef(null);

  const filterKey = useMemo(() => {
    const area = activeFilters.has('area') ? (filterValues.get('area') || '') : '';
    const experience = activeFilters.has('experience') ? (filterValues.get('experience') || '') : '';
    return `area:${area}|experience:${experience}`;
  }, [activeFilters, filterValues]);

  const purposes = suggestionOption?.purposes || [];
  const crowd = suggestionOption?.crowd ?? null;
  const optionKey = [
    purposes.slice().sort().join(','),
    crowd || '',
  ].join('|');

  useEffect(() => {
    if (!origin) return;
    let cancelled = false;
    setCandidates(null);
    setFetchError(false);

    (async () => {
      const filters = {
        origin: { lat: origin.lat, lng: origin.lng },
        max_flight_hours: 4,
        limit: 20,
      };

      if (month) filters.month = month;
      if (purposes.length > 0) filters.vibes = purposes;
      if (crowd) filters.crowd = crowd;

      const area = activeFilters.has('area') ? filterValues.get('area') : null;
      if (area) filters.region = area;

      const experience = activeFilters.has('experience') ? filterValues.get('experience') : null;
      if (experience) {
        filters.vibes = [...(filters.vibes || []), experience];
      }

      let results;
      try {
        results = await discover(filters);
      } catch {
        if (!cancelled) { setFetchError(true); setCandidates([]); }
        return;
      }
      if (cancelled) return;

      const filtered = results.filter((c) => {
        if (origin.id != null) return c.city_id !== origin.id;
        return !(c.name === origin.name && c.country === origin.country);
      });

      setCandidates(filtered);
    })();

    return () => { cancelled = true; };
  }, [origin, filterKey, optionKey, month]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollLeft = 0;
    setActiveIdx(0);
  }, [candidates]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !candidates || candidates.length === 0) return;
    const cards = scroller.querySelectorAll('[data-rec-card]');
    if (!cards.length) return;
    const ratios = new Map();
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const idx = Number(e.target.getAttribute('data-idx'));
        if (e.isIntersecting) ratios.set(idx, e.intersectionRatio);
        else ratios.delete(idx);
      }
      let bestIdx = -1;
      let bestRatio = -1;
      for (const [idx, r] of ratios.entries()) {
        if (r > bestRatio) { bestRatio = r; bestIdx = idx; }
      }
      if (bestIdx >= 0) setActiveIdx(bestIdx);
    }, { root: scroller, threshold: [0.5, 0.75, 0.9] });
    cards.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [candidates]);

  const outerRef = useRef(null);
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const topFromBottom = Math.max(0, window.innerHeight - rect.top);
      document.documentElement.style.setProperty('--rec-carousel-top', `${topFromBottom}px`);
    };
    update();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', update);
      document.documentElement.style.setProperty('--rec-carousel-top', '0px');
    };
  }, [candidates]);

  const outerStyle = {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 'max(80px, calc(60px + env(safe-area-inset-bottom)))',
    zIndex: 1500,
    pointerEvents: 'none',
  };

  const closeBtnStyle = {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'transparent',
    color: 'var(--bg)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    zIndex: 2,
    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
  };

  const scrollerStyle = {
    overflowX: 'auto',
    display: 'flex',
    gap: 12,
    padding: '0 calc(50vw - 132px)',
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch',
    pointerEvents: 'auto',
    touchAction: 'pan-x',
    overscrollBehavior: 'contain',
  };

  const cardWrapperStyle = {
    flex: '0 0 240px',
    scrollSnapAlign: 'center',
    background: 'var(--surface, #fff)',
    borderRadius: 'var(--r-lg)',
    boxShadow: 'var(--shadow-lg)',
    overflow: 'hidden',
    position: 'relative',
  };

  const renderCloseBtn = () => (
    <button
      type="button"
      aria-label="Close suggestions"
      title="Close"
      onClick={(e) => { e.stopPropagation(); bump(); onFocusCity?.(origin); onClose?.(); }}
      style={closeBtnStyle}
    >
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="18" y1="6" x2="6" y2="18" />
      </svg>
    </button>
  );

  return (
    <div ref={outerRef} style={outerStyle}>
      <div ref={scrollerRef} style={scrollerStyle}>
        {candidates == null && (
          <div
            className="skeleton"
            style={{
              ...cardWrapperStyle,
              height: 280,
            }}
          />
        )}

        {Array.isArray(candidates) && candidates.length === 0 && (
          <div style={{ ...cardWrapperStyle, padding: 16 }}>
            <div style={{
              fontSize: 14,
              color: fetchError ? 'var(--danger)' : 'var(--text)',
              lineHeight: 1.4,
              marginBottom: 12,
            }}
            role={fetchError ? 'alert' : undefined}
            >
              {fetchError
                ? 'Could not load suggestions. Check your connection and try again.'
                : `No cities match these filters near ${origin?.name}. Try turning off a filter.`}
            </div>
            <button
              type="button"
              onClick={() => { bump(); onClose?.(); }}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--r-md)',
                border: 'none',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              OK
            </button>
          </div>
        )}

        {Array.isArray(candidates) && candidates.length > 0 && candidates.map((c, i) => {
          const city = { id: c.city_id, name: c.name, country: c.country, lat: c.lat, lng: c.lng };
          return (
            <div
              key={c.city_id ?? `${c.name}-${c.country}-${i}`}
              data-rec-card
              data-idx={i}
              onClick={() => onFocusCity?.(city)}
              style={{ ...cardWrapperStyle, cursor: 'pointer' }}
            >
              <SuggestionItem
                city={city}
                onAdd={onAddCity ? () => { onAddCity(city); onClose?.(); } : undefined}
              />
              {i === activeIdx && renderCloseBtn()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

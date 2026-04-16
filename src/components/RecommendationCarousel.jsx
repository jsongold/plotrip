import { useEffect, useRef, useState, useMemo } from 'react';
import { CityPinPopup } from './CityPinPopup';
import { useFilter } from '../context/FilterContext';
import { supabase } from '../lib/supabase';
import { haversineKm } from '../lib/distance';

export function RecommendationCarousel({ origin, onClose, onFocusCity }) {
  const { activeFilters, filterValues } = useFilter();
  const [candidates, setCandidates] = useState(null);
  const scrollerRef = useRef(null);

  // Serialize filter state so useEffect deps are stable primitives.
  const filterKey = useMemo(() => {
    const area = activeFilters.has('area') ? (filterValues.get('area') || '') : '';
    const experience = activeFilters.has('experience') ? (filterValues.get('experience') || '') : '';
    return `area:${area}|experience:${experience}`;
  }, [activeFilters, filterValues]);

  // Fetch + rank candidates.
  useEffect(() => {
    if (!origin) return;
    let cancelled = false;
    setCandidates(null);

    (async () => {
      let q = supabase
        .from('catalog_cities')
        .select('id,name,country,lat,lng,area,experiences,population')
        .not('lat', 'is', null)
        .gte('population', 50000)
        .limit(500);

      if (activeFilters.has('area')) {
        const v = filterValues.get('area');
        if (v) q = q.eq('area', v);
      }
      if (activeFilters.has('experience')) {
        const v = filterValues.get('experience');
        if (v) q = q.contains('experiences', [v]);
      }

      const { data, error } = await q;
      if (cancelled) return;
      if (error || !Array.isArray(data)) {
        setCandidates([]);
        return;
      }

      const filtered = data.filter((c) => {
        if (origin.id != null) return c.id !== origin.id;
        return !(c.name === origin.name && c.country === origin.country);
      });

      const ranked = filtered
        .map((c) => ({ c, d: haversineKm(origin.lat, origin.lng, c.lat, c.lng) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 20)
        .map(({ c }) => c);

      setCandidates(ranked);
    })();

    return () => { cancelled = true; };
  }, [origin, filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escape-to-close.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Reset scroll position when candidates change.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollLeft = 0;
  }, [candidates]);

  // Publish the carousel's top-edge distance-from-viewport-bottom as a CSS
  // variable so floating icons (filter bar, tooltip toggle) can ride above.
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
    bottom: 80,
    zIndex: 1500,
    pointerEvents: 'none',
  };

  const closeBtnStyle = {
    position: 'absolute',
    top: -40,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'rgba(17, 17, 17, 0.72)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    pointerEvents: 'auto',
    transition: 'background 120ms ease, transform 120ms ease',
  };

  const scrollerStyle = {
    overflowX: 'auto',
    display: 'flex',
    gap: 12,
    padding: '0 calc(50vw - 132px)',
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch',
    pointerEvents: 'auto',
  };

  const cardWrapperStyle = {
    flex: '0 0 240px',
    scrollSnapAlign: 'center',
    background: 'var(--surface, #fff)',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    overflow: 'hidden',
  };

  return (
    <div ref={outerRef} style={outerStyle}>
      <button
        type="button"
        aria-label="Close recommendations"
        title="Close"
        onClick={onClose}
        style={closeBtnStyle}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      </button>

      <div ref={scrollerRef} style={scrollerStyle}>
        {candidates == null && (
          <div
            className="skeleton"
            style={{
              ...cardWrapperStyle,
              height: 280,
              background: '#f1f1f1',
            }}
          />
        )}

        {Array.isArray(candidates) && candidates.length === 0 && (
          <div style={{ ...cardWrapperStyle, padding: 16 }}>
            <div style={{
              fontSize: 14,
              color: 'var(--text, #111)',
              lineHeight: 1.4,
              marginBottom: 12,
            }}>
              No cities match these filters near {origin?.name}. Try turning off a filter.
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid var(--border, #ddd)',
                background: 'var(--surface, #fff)',
                color: 'var(--text, #111)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              OK
            </button>
          </div>
        )}

        {Array.isArray(candidates) && candidates.length > 0 && candidates.map((c, i) => (
          <div
            key={c.id ?? `${c.name}-${c.country}-${i}`}
            data-rec-card
            data-idx={i}
            onClick={() => onFocusCity?.(c)}
            style={{ ...cardWrapperStyle, cursor: 'pointer' }}
          >
            <CityPinPopup city={c} />
          </div>
        ))}
      </div>
    </div>
  );
}

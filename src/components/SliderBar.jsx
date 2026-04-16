import { useEffect, useMemo, useRef, useState } from 'react';
import { RegionSlider, REGIONS } from './sliders/RegionSlider';
import { MonthSlider } from './sliders/MonthSlider';
import { VibePicker } from './sliders/VibePicker';
import { debounce } from '../lib/discover';

const DEFAULT_REGION = REGIONS[0];

/**
 * SliderBar composes the three live controls. Internal state updates immediately
 * (so the UI is always responsive) but onChange is debounced to 150ms to avoid
 * thrashing the map / RPC when a user drags the month slider.
 */
export function SliderBar({
  value,
  onChange,
  moodSlug,
}) {
  const [month, setMonth]   = useState(value?.month   ?? new Date().getMonth() + 1);
  const [region, setRegion] = useState(value?.region  ?? DEFAULT_REGION.value);
  const [bbox, setBbox]     = useState(value?.regionBbox ?? DEFAULT_REGION.bbox);
  const [vibes, setVibes]   = useState(value?.vibes   ?? []);

  // Sync external value (e.g., when a mood is applied).
  useEffect(() => {
    if (!value) return;
    if (value.month !== undefined && value.month !== month) setMonth(value.month);
    if (value.region !== undefined && value.region !== region) {
      setRegion(value.region);
      if (value.regionBbox) setBbox(value.regionBbox);
    }
    if (value.vibes !== undefined && JSON.stringify(value.vibes) !== JSON.stringify(vibes)) {
      setVibes(value.vibes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.month, value?.region, JSON.stringify(value?.vibes)]);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const debouncedEmit = useMemo(
    () => debounce((payload) => onChangeRef.current?.(payload), 150),
    []
  );

  useEffect(() => () => debouncedEmit.cancel?.(), [debouncedEmit]);

  useEffect(() => {
    debouncedEmit({ month, region, regionBbox: bbox, vibes, moodSlug });
  }, [month, region, bbox, vibes, moodSlug, debouncedEmit]);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--s-3)',
        padding: 'var(--s-3) var(--s-4)',
        background: 'var(--surface)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
        opacity: 0.96,
      }}
      className="plotrip-slider-bar"
    >
      <style>{`
        @media (min-width: 768px) {
          .plotrip-slider-bar {
            flex-direction: row !important;
            align-items: center;
            gap: var(--s-5) !important;
          }
          .plotrip-slider-bar > .slider-bar-row {
            flex: 1;
            min-width: 0;
          }
          .plotrip-slider-bar > .slider-bar-row.region { flex: 1.2; }
          .plotrip-slider-bar > .slider-bar-row.month  { flex: 1.3; }
          .plotrip-slider-bar > .slider-bar-row.vibes  { flex: 2; }
        }
      `}</style>

      <div className="slider-bar-row region">
        <Label>Where</Label>
        <RegionSlider
          value={region}
          onChange={({ value: v, bbox: b }) => {
            setRegion(v);
            setBbox(b);
          }}
        />
      </div>

      <div className="slider-bar-row month">
        <Label>When</Label>
        <MonthSlider value={month} onChange={setMonth} />
      </div>

      <div className="slider-bar-row vibes">
        <Label>Vibe</Label>
        <VibePicker value={vibes} onChange={setVibes} />
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{
      fontSize: 'var(--font-xs)',
      fontWeight: 'var(--fw-semibold)',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: 'var(--text-muted)',
      marginBottom: 'var(--s-1)',
      paddingLeft: 'var(--s-1)',
    }}>
      {children}
    </div>
  );
}

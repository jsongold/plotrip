import { useRef } from 'react';
import { bump } from '../../lib/haptics';

/**
 * Region chip carousel. We intentionally use a horizontally scrollable chip row
 * rather than a drag slider because snapping a 1-D slider across 10 unordered
 * regions is fiddly and hurts discoverability. Chips scan better.
 */
export const REGIONS = [
  { value: 'anywhere',       label: 'Anywhere',      emoji: '🌍', bbox: [[-60, -180], [80, 180]] },
  { value: 'europe',         label: 'Europe',        emoji: '🏰', bbox: [[35, -10],  [71, 40]] },
  { value: 'east-asia',      label: 'East Asia',     emoji: '🏯', bbox: [[20, 100],  [50, 150]] },
  { value: 'se-asia',        label: 'SE Asia',       emoji: '🌴', bbox: [[-11, 92],  [23, 141]] },
  { value: 'south-asia',     label: 'South Asia',    emoji: '🛕', bbox: [[5, 60],    [37, 97]] },
  { value: 'middle-east',    label: 'Middle East',   emoji: '🕌', bbox: [[12, 25],   [42, 63]] },
  { value: 'africa',         label: 'Africa',        emoji: '🦁', bbox: [[-35, -18], [37, 52]] },
  { value: 'north-america',  label: 'N America',     emoji: '🗽', bbox: [[15, -170], [72, -50]] },
  { value: 'latin-america',  label: 'Latin America', emoji: '🌋', bbox: [[-56, -118],[33, -34]] },
  { value: 'oceania',        label: 'Oceania',       emoji: '🏝',  bbox: [[-48, 110], [0, 180]] },
];

export function RegionSlider({ value = 'anywhere', onChange }) {
  const scrollerRef = useRef(null);

  const handleSelect = (region) => {
    if (region.value === value) return;
    bump();
    onChange?.({ value: region.value, bbox: region.bbox });
  };

  return (
    <div
      ref={scrollerRef}
      style={{
        display: 'flex',
        gap: 'var(--s-2)',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        padding: 'var(--s-1) var(--s-1)',
        margin: '0 calc(var(--s-1) * -1)',
        scrollbarWidth: 'none',
      }}
    >
      {REGIONS.map((r) => {
        const active = r.value === value;
        return (
          <button
            key={r.value}
            type="button"
            onClick={() => handleSelect(r)}
            style={{
              flex: '0 0 auto',
              scrollSnapAlign: 'start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--s-1)',
              padding: '8px 14px',
              borderRadius: 'var(--r-pill)',
              border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              background: active ? 'var(--accent)' : 'var(--surface-2)',
              color: active ? 'var(--accent-text)' : 'var(--text)',
              fontSize: 'var(--font-sm)',
              fontWeight: active ? 'var(--fw-semibold)' : 'var(--fw-medium)',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: `background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)`,
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 'var(--font-base)' }}>{r.emoji}</span>
            <span>{r.label}</span>
          </button>
        );
      })}
    </div>
  );
}

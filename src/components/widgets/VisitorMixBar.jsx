import { useState } from 'react';

const SEGMENTS = [
  { key: 'couples', label: 'Couples', color: 'var(--accent)' },
  { key: 'families', label: 'Families', color: 'var(--warning)' },
  { key: 'solo', label: 'Solo', color: 'var(--success)' },
  { key: 'backpackers', label: 'Backpackers', color: '#ec4899' },
  { key: 'luxury', label: 'Luxury', color: '#a855f7' },
  { key: 'nomad', label: 'Nomad', color: '#14b8a6' },
];

export function VisitorMixBar({ mix = {}, height = 8 }) {
  const [hover, setHover] = useState(null);

  const total = SEGMENTS.reduce((acc, s) => acc + (Number(mix?.[s.key]) || 0), 0);
  const segs = SEGMENTS.map((s) => ({
    ...s,
    value: Number(mix?.[s.key]) || 0,
  })).filter((s) => s.value > 0);

  if (total === 0 || segs.length === 0) {
    return (
      <div
        style={{
          height,
          borderRadius: 'var(--r-pill)',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
        }}
      />
    );
  }

  const pct = (v) => (v / total) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-1)' }}>
      <div
        style={{
          display: 'flex',
          height,
          borderRadius: 'var(--r-pill)',
          overflow: 'hidden',
          background: 'var(--surface-2)',
        }}
      >
        {segs.map((s) => (
          <span
            key={s.key}
            onMouseEnter={() => setHover(s.key)}
            onMouseLeave={() => setHover(null)}
            onTouchStart={() => setHover(s.key)}
            onTouchEnd={() => setHover(null)}
            style={{
              width: `${pct(s.value)}%`,
              background: s.color,
              cursor: 'pointer',
              opacity: hover && hover !== s.key ? 0.5 : 1,
              transition: 'opacity var(--dur-fast) var(--ease-out)',
            }}
            title={`${s.label}: ${Math.round(pct(s.value))}%`}
          />
        ))}
      </div>
      {hover && (
        <div
          style={{
            fontSize: 'var(--font-xs)',
            color: 'var(--text-muted)',
          }}
        >
          {SEGMENTS.find((s) => s.key === hover)?.label}{' '}
          {Math.round(pct(segs.find((s) => s.key === hover)?.value || 0))}%
        </div>
      )}
    </div>
  );
}

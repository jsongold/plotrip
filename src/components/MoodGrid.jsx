import { useEffect, useState } from 'react';
import { getMoods } from '../lib/discover';
import { Skeleton } from './Skeleton';

export function MoodGrid({ onSelect }) {
  const [moods, setMoods] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMoods().then((data) => {
      if (!cancelled) setMoods(data);
    });
    return () => { cancelled = true; };
  }, []);

  const loading = moods === null;

  return (
    <div
      className="plotrip-mood-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'var(--s-3)',
        width: '100%',
      }}
    >
      <style>{`
        @media (min-width: 768px) {
          .plotrip-mood-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
      {loading && Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          style={{
            aspectRatio: '4 / 3',
            borderRadius: 'var(--r-lg)',
            overflow: 'hidden',
          }}
        >
          <Skeleton width="100%" height="100%" radius={12} />
        </div>
      ))}
      {!loading && moods.length === 0 && (
        <div style={{
          gridColumn: '1 / -1',
          color: 'var(--text-muted)',
          fontSize: 'var(--font-sm)',
          textAlign: 'center',
          padding: 'var(--s-5)',
        }}>
          No moods available.
        </div>
      )}
      {!loading && moods.map((m) => (
        <MoodCard key={m.slug} mood={m} onSelect={onSelect} />
      ))}
    </div>
  );
}

function MoodCard({ mood, onSelect }) {
  const gradient = mood.gradient
    || `linear-gradient(135deg, ${hashColor(mood.slug, 0)}, ${hashColor(mood.slug, 1)})`;

  return (
    <button
      type="button"
      onClick={() => onSelect?.({ slug: mood.slug, filter_json: mood.filter_json ?? {} })}
      style={{
        position: 'relative',
        aspectRatio: '4 / 3',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: gradient,
        color: '#fff',
        textAlign: 'left',
        cursor: 'pointer',
        padding: 'var(--s-3)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
      }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.45) 100%)',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'absolute', top: 'var(--s-2)', left: 'var(--s-3)', fontSize: 28, lineHeight: 1 }}>
        {mood.emoji || '✨'}
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{
          fontSize: 'var(--font-md)',
          fontWeight: 'var(--fw-bold)',
          lineHeight: 1.2,
        }}>
          {mood.name || mood.slug}
        </div>
        {mood.description && (
          <div style={{
            fontSize: 'var(--font-xs)',
            opacity: 0.9,
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {mood.description}
          </div>
        )}
      </div>
    </button>
  );
}

// Cheap deterministic gradient when a mood row has no explicit gradient.
function hashColor(slug, salt) {
  let h = salt * 97;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  const hue = ((h % 360) + 360) % 360;
  return `hsl(${hue}, 70%, ${salt === 0 ? 55 : 40}%)`;
}

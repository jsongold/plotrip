import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useCityMeta } from '../hooks/useCityMeta';
import { forSlot, renderField } from '../lib/city/fields';

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" aria-hidden="true">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

export function CityPinPopup({ city, month = new Date().getMonth() + 1, onAdd, onRecommend }) {
  const ref = useCityMeta(city, { month });
  const metaFields = forSlot('pinMeta')
    .map((f) => renderField(ref, f, { month }))
    .filter(Boolean);
  const tags = ref.get('tags', []) || [];
  const metaText = metaFields.map((f) => f.text).join(' · ');

  const [wiki, setWiki] = useState(null);
  const showAdd = typeof onAdd === 'function';
  const showRecommend = typeof onRecommend === 'function';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city.name)}`,
          { headers: { Accept: 'application/json' } }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setWiki(data);
      } catch {
        /* silent */
      }
    })();
    return () => { cancelled = true; };
  }, [city.name]);

  const thumbUrl = wiki?.thumbnail?.source || null;
  const description = wiki?.description || '';
  const extract = wiki?.extract || '';
  const subtitle = [city.country, description].filter(Boolean).join(' · ');

  return (
    <div style={{
      width: 240,
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      color: 'var(--text, #111)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        flex: '0 0 auto',
        height: 120,
        background: thumbUrl
          ? `url("${thumbUrl}") center/cover`
          : 'linear-gradient(135deg, #c7d2fe 0%, #f9a8d4 100%)',
      }} />

      <div style={{ flex: '1 1 auto', padding: '10px 12px 12px' }}>
        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.2, color: 'var(--text, #111)' }}>
          {city.name}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: 'var(--text-muted, #666)', marginTop: 2 }}>
            {subtitle}
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-muted, #888)', marginTop: 8, minHeight: 16 }}>
          {metaText || '…'}
        </div>

        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {tags.map((t) => (
              <span key={t.tag} style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 999,
                background: 'var(--surface-2, #f1f1f1)',
                color: 'var(--text-muted, #555)',
              }}>{t.tag}</span>
            ))}
          </div>
        )}

        {extract && (
          <div style={{
            fontSize: 12,
            color: 'var(--text-muted, #555)',
            lineHeight: 1.4,
            marginTop: 10,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>{extract}</div>
        )}
      </div>

      {showAdd && (
        <button
          aria-label="Add to trip"
          title="Add to trip"
          onClick={(e) => { e.stopPropagation(); onAdd(); }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(220,38,38,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,38,38,0.4)';
          }}
          style={{
            position: 'absolute',
            top: 96,
            right: 12,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: '#dc2626',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(220,38,38,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            transition: 'transform 120ms ease, box-shadow 120ms ease',
          }}
        >
          <PinIcon />
        </button>
      )}

      {showRecommend && (
        <button
          aria-label="Recommend nearby"
          title="Recommend nearby"
          onClick={(e) => { e.stopPropagation(); onRecommend(); }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(8,145,178,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(8,145,178,0.4)';
          }}
          style={{
            position: 'absolute',
            top: 96,
            right: showAdd ? 64 : 12,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: '#0891b2',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(8,145,178,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            transition: 'transform 120ms ease, box-shadow 120ms ease',
          }}
        >
          <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden="true">
            <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2zm6 12l.9 2.6L21.5 18l-2.6.9L18 21.5l-.9-2.6L14.5 18l2.6-.9L18 14z"/>
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Mounts <CityPinPopup> into a detached DOM element and returns it so it can
 * be handed to `L.popup().setContent(...)`.
 *
 * The returned element exposes `_unmount()` — the caller (or a Leaflet
 * popupclose listener) can invoke it to tear down the React root.
 */
export function mountCityPinPopup(city, opts = {}) {
  const container = document.createElement('div');
  const root = createRoot(container);
  root.render(<CityPinPopup city={city} {...opts} />);
  container._unmount = () => { try { root.unmount(); } catch {} };
  return container;
}

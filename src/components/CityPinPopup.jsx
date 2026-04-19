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

const PURPOSE_OPTIONS = [
  { value: 'beach', label: 'Beach' },
  { value: 'food', label: 'Food' },
  { value: 'hiking', label: 'Hiking' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'party', label: 'Party' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'winter_sport', label: 'Winter sport' },
];

const SUGGESTION_OPTIONS = [
  {
    type: 'distance',
    label: 'Distance',
    icon: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    type: 'transit',
    label: 'Transit',
    icon: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1l5.5 3.2-3.5 3.5-2.2-.8c-.4-.1-.8 0-1 .3l-.2.3c-.2.3-.1.7.1 1l2.7 2.7c.3.2.7.3 1 .1l.3-.2c.3-.2.4-.6.3-1l-.8-2.2 3.5-3.5 3.2 5.5c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z" />
      </svg>
    ),
  },
  {
    type: 'popular',
    label: 'Popular',
    icon: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    type: 'purpose',
    label: 'Purpose',
    icon: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
];

const optionBtnStyle = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  background: 'var(--surface-2, #f1f1f1)',
  color: 'var(--text, #111)',
  transition: 'transform 120ms ease, background 120ms ease',
};

const activeOptionBtnStyle = {
  ...optionBtnStyle,
  background: 'var(--accent, #2563eb)',
  color: 'var(--accent-text, #fff)',
};

export function CityPinPopup({ city, month = new Date().getMonth() + 1, onAdd, onSuggest }) {
  const ref = useCityMeta(city, { month });
  const metaFields = forSlot('pinMeta')
    .map((f) => renderField(ref, f, { month }))
    .filter(Boolean);
  const tags = ref.get('tags', []) || [];
  const metaText = metaFields.map((f) => f.text).join(' · ');

  const [wiki, setWiki] = useState(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [purposeOpen, setPurposeOpen] = useState(false);
  const showAdd = typeof onAdd === 'function';
  const showSuggest = typeof onSuggest === 'function';

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

  const handleOptionSelect = (type, purpose) => {
    setOptionsOpen(false);
    setPurposeOpen(false);
    onSuggest({ type, purpose: purpose || null });
  };

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
          {metaText || '...'}
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
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          style={{
            position: 'absolute',
            top: 96,
            right: 12,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--danger)',
            color: 'var(--danger-text)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
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

      {showSuggest && (
        <button
          aria-label="Suggest nearby"
          title="Suggest nearby"
          onClick={(e) => { e.stopPropagation(); setOptionsOpen((v) => !v); setPurposeOpen(false); }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          style={{
            position: 'absolute',
            top: 96,
            right: showAdd ? 64 : 12,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: optionsOpen ? 'var(--accent, #2563eb)' : 'var(--secondary)',
            color: optionsOpen ? 'var(--accent-text, #fff)' : 'var(--secondary-text)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            transition: 'transform 120ms ease, box-shadow 120ms ease, background 120ms ease',
          }}
        >
          <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden="true">
            <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2zm6 12l.9 2.6L21.5 18l-2.6.9L18 21.5l-.9-2.6L14.5 18l2.6-.9L18 14z"/>
          </svg>
        </button>
      )}

      {optionsOpen && (
        <div style={{ padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {SUGGESTION_OPTIONS.map(({ type, label, icon }) => (
              <button
                key={type}
                type="button"
                aria-label={label}
                title={label}
                onClick={(e) => {
                  e.stopPropagation();
                  if (type === 'purpose') {
                    setPurposeOpen((v) => !v);
                  } else {
                    handleOptionSelect(type);
                  }
                }}
                style={type === 'purpose' && purposeOpen ? activeOptionBtnStyle : optionBtnStyle}
              >
                {icon}
              </button>
            ))}
          </div>

          {purposeOpen && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
              {PURPOSE_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleOptionSelect('purpose', p.value); }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--r-pill, 999px)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 500,
                    background: 'var(--surface-2, #f1f1f1)',
                    color: 'var(--text, #111)',
                    transition: 'transform 120ms ease',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function mountCityPinPopup(city, opts = {}) {
  const container = document.createElement('div');
  const root = createRoot(container);
  root.render(<CityPinPopup city={city} {...opts} />);
  container._unmount = () => { try { root.unmount(); } catch {} };
  return container;
}

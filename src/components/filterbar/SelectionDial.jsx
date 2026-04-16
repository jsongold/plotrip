import { useEffect, useRef } from 'react';
import { bump } from '../../lib/haptics';
import { FilterSlugIcon } from './icons';

/**
 * Cost / Vibes 等、options 付き filter 用のアイコン + 上方向 popup (level 選択)。
 * 見た目は透明背景のアイコンのみ。active 時は accent 色。
 */
export function SelectionDial({
  slug,
  label,
  options,
  active,
  value,
  onToggleOpen,
  onChangeValue,
}) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    function onDoc(e) {
      if (!rootRef.current?.contains(e.target)) onToggleOpen(false);
    }
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [active, onToggleOpen]);

  return (
    <div ref={rootRef} style={{ position: 'relative', flex: '0 0 auto', pointerEvents: 'auto' }}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        aria-expanded={active}
        title={label}
        onClick={() => { bump(); onToggleOpen(!active); }}
        style={{
          width: 44, height: 44,
          borderRadius: 10,
          border: `1px solid ${active ? '#000' : 'rgba(0,0,0,0.08)'}`,
          background: active ? '#000' : '#fff',
          color: active ? '#fff' : '#000',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, cursor: 'pointer', flex: '0 0 auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          transition: 'all var(--dur-fast, 120ms) var(--ease-out)',
        }}
      >
        <FilterSlugIcon slug={slug} size={24} />
      </button>

      {active && (
        <div
          role="listbox"
          aria-label={`${label} level`}
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            right: 0,
            display: 'flex',
            gap: 6,
            padding: 8,
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            zIndex: 2000,
          }}
        >
          {options.map((opt) => {
            const sel = opt.value === value;
            return (
              <button
                key={opt.value}
                role="option"
                aria-selected={sel}
                type="button"
                onClick={() => {
                  bump();
                  onChangeValue(sel ? null : opt.value);
                }}
                style={{
                  minWidth: 72,
                  height: 38,
                  padding: '0 12px',
                  borderRadius: 8,
                  border: `1px solid ${sel ? 'var(--accent)' : 'rgba(0,0,0,0.1)'}`,
                  background: sel ? 'var(--accent)' : 'transparent',
                  color: '#000',
                  fontSize: 13,
                  fontWeight: sel ? 700 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { bump } from '../../lib/haptics';
import { CalendarIcon } from './icons';

const MONTH_LABELS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function MonthDial({ month, onChange, popupDirection = 'up' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: 'relative', flex: '0 0 auto', pointerEvents: 'auto' }}>
      <button
        type="button"
        aria-label={`Select month (${MONTH_LABELS_SHORT[month - 1]})`}
        aria-expanded={open}
        title={MONTH_LABELS_SHORT[month - 1]}
        onClick={() => { bump(); setOpen((v) => !v); }}
        style={{
          width: 44, height: 44,
          borderRadius: 10,
          border: `1px solid ${open ? '#000' : 'rgba(0,0,0,0.08)'}`,
          background: open ? '#000' : '#fff',
          color: open ? '#fff' : '#000',
          cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          transition: 'all var(--dur-fast, 120ms) var(--ease-out)',
        }}
      >
        <CalendarIcon size={24} />
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          ...(popupDirection === 'down'
            ? { top: 'calc(100% + 8px)' }
            : { bottom: 'calc(100% + 8px)' }),
          right: 0,
          display: 'grid', gridTemplateColumns: 'repeat(4, 64px)',
          gap: 4, padding: 8,
          background: '#fff',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          zIndex: 2000,
        }}>
          {MONTH_LABELS_SHORT.map((lbl, i) => {
            const m = i + 1;
            const sel = m === month;
            return (
              <button
                key={m}
                type="button"
                onClick={() => { bump(); onChange(m); setOpen(false); }}
                style={{
                  height: 36, borderRadius: 8,
                  border: `1px solid ${sel ? 'var(--accent)' : 'rgba(0,0,0,0.1)'}`,
                  background: sel ? 'var(--accent)' : 'transparent',
                  color: '#000',
                  fontSize: 13, fontWeight: sel ? 700 : 500,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {lbl}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

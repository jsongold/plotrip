import { useState, useRef, useEffect } from 'react';
import { bump } from '../../lib/haptics';

const MONTH_LABELS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

export function MonthDial({ month, onChange }) {
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
        aria-label="月を選択"
        aria-expanded={open}
        onClick={() => { bump(); setOpen(v => !v); }}
        style={{
          height: 44, padding: '0 14px',
          borderRadius: 'var(--r-pill, 9999px)',
          border: '1.5px solid var(--border)',
          background: 'var(--surface, #fff)',
          color: 'var(--text, #111)',
          fontSize: 14, fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}
      >
        <span aria-hidden="true">📅</span>
        {MONTH_LABELS[month - 1]}
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)', left: 0,
          display: 'grid', gridTemplateColumns: 'repeat(4, 56px)',
          gap: 4, padding: 8,
          background: 'var(--surface, #fff)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          zIndex: 2000,
        }}>
          {MONTH_LABELS.map((lbl, i) => {
            const m = i + 1;
            const sel = m === month;
            return (
              <button
                key={m}
                type="button"
                onClick={() => { bump(); onChange(m); setOpen(false); }}
                style={{
                  height: 36, borderRadius: 8,
                  border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                  background: sel ? 'var(--accent)' : 'var(--surface-2, #fafafa)',
                  color: sel ? '#fff' : 'var(--text, #111)',
                  fontSize: 13, fontWeight: sel ? 600 : 500,
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

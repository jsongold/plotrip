import { useState, useEffect } from 'react';
import { Toolbar } from './Toolbar';
import { bump } from '../lib/haptics';

export function CityActionSheet({ open, city, onClose, onChange }) {
  const [mode, setMode] = useState('menu');

  useEffect(() => {
    if (open) setMode('menu');
  }, [open, city?.name]);

  if (!open || !city) return null;

  const title = mode === 'change'
    ? `Change ${city.name || 'destination'}`
    : (city.name || 'Destination');

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'var(--surface)',
          color: 'var(--text)',
          borderTopLeftRadius: 'var(--r-xl)',
          borderTopRightRadius: 'var(--r-xl)',
          padding: 'var(--s-4) var(--s-4) calc(var(--s-5) + env(safe-area-inset-bottom))',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '90dvh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{
          width: 40, height: 4, background: 'var(--border-strong)',
          borderRadius: 'var(--r-pill)', margin: '0 auto var(--s-3)',
        }} />
        <h3 style={{
          margin: 0, marginBottom: 'var(--s-3)',
          fontSize: 'var(--font-md)', fontWeight: 'var(--fw-semibold)',
        }}>
          {title}
        </h3>
        {mode === 'menu' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
            <ActionRow
              icon={<SwapIcon />}
              label="Change destination"
              sublabel="Replace with a different city"
              onClick={() => { bump(); setMode('change'); }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)', minHeight: 320 }}>
            <Toolbar
              menuPlacement="bottom"
              usePortal={false}
              onAdd={(picked) => {
                if (!picked) return;
                onChange(picked);
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--s-2)' }}>
              <button
                type="button"
                onClick={() => setMode('menu')}
                style={ghostBtn}
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionRow({ icon, label, sublabel, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--s-3)',
        width: '100%',
        padding: 'var(--s-3)',
        borderRadius: 'var(--r-md)',
        border: 'none',
        background: 'var(--surface-2, #f1f1f1)',
        color: 'var(--text)',
        cursor: 'pointer',
        textAlign: 'left',
        minHeight: 56,
      }}
    >
      <span style={{
        width: 36, height: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '50%',
        background: 'var(--surface)',
        color: 'var(--accent)',
      }}>{icon}</span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 'var(--font-base)', fontWeight: 'var(--fw-semibold)' }}>{label}</span>
        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{sublabel}</span>
      </span>
    </button>
  );
}

const ghostBtn = {
  padding: '10px 16px',
  borderRadius: 'var(--r-md)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  fontSize: 'var(--font-sm)',
  fontWeight: 'var(--fw-medium)',
  cursor: 'pointer',
};

function SwapIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  );
}


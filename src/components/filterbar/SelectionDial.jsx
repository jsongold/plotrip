import { useEffect, useRef } from 'react';
import { bump } from '../../lib/haptics';

/**
 * Cost / Vibes 等、options 付き filter 用の円形ボタン + 上方向 popup。
 *
 * - icon tap で active を toggle (popup 表示と連動)
 * - popup 内の option pill で value を選ぶ
 * - popup 外 click で閉じる = filter OFF (value もクリア)
 *
 * @param {{
 *   slug: string,
 *   label: string,
 *   icon: any,
 *   options: Array<{value:string, label:string, icon?:string}>,
 *   active: boolean,
 *   value: string|null,
 *   onToggleOpen: (open:boolean) => void,
 *   onChangeValue: (value:string|null) => void,
 * }} props
 */
export function SelectionDial({
  slug,
  label,
  icon,
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
          borderRadius: '50%',
          border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
          background: active ? 'var(--accent)' : 'var(--surface, #fff)',
          color: active ? '#fff' : 'var(--text, #111)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, cursor: 'pointer', flex: '0 0 auto',
          boxShadow: active
            ? '0 4px 12px rgba(37,99,235,0.35)'
            : '0 2px 8px rgba(0,0,0,0.12)',
          transition: 'all var(--dur-fast, 120ms) var(--ease-out)',
        }}
      >
        {icon}
      </button>

      {active && (
        <div
          role="listbox"
          aria-label={`${label} level`}
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 6,
            padding: 8,
            background: 'var(--surface, #fff)',
            border: '1px solid var(--border)',
            borderRadius: 14,
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
                  height: 40,
                  padding: '0 12px',
                  borderRadius: 999,
                  border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                  background: sel ? 'var(--accent)' : 'var(--surface-2, #fafafa)',
                  color: sel ? '#fff' : 'var(--text, #111)',
                  fontSize: 13,
                  fontWeight: sel ? 700 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  whiteSpace: 'nowrap',
                }}
              >
                {opt.icon && <span aria-hidden="true">{opt.icon}</span>}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

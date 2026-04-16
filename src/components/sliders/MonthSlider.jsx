import { useRef } from 'react';
import { bump } from '../../lib/haptics';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function MonthSlider({ value = new Date().getMonth() + 1, onChange }) {
  const lastRef = useRef(value);

  const handleChange = (e) => {
    const next = Number(e.target.value);
    if (next !== lastRef.current) {
      lastRef.current = next;
      bump();
    }
    onChange?.(next);
  };

  const pct = ((value - 1) / 11) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-1)', width: '100%' }}>
      <div style={{ position: 'relative', height: 32, display: 'flex', alignItems: 'center' }}>
        {/* segmented track background */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0, right: 0, top: '50%',
            transform: 'translateY(-50%)',
            height: 8,
            borderRadius: 'var(--r-pill)',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                borderRight: i < 11 ? '1px solid var(--border)' : 'none',
              }}
            />
          ))}
        </div>
        {/* active fill */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0, top: '50%',
            transform: 'translateY(-50%)',
            height: 8,
            width: `calc(${pct}% + 8px)`,
            borderRadius: 'var(--r-pill)',
            background: 'var(--accent)',
            opacity: 0.35,
            pointerEvents: 'none',
          }}
        />
        <input
          type="range"
          min={1}
          max={12}
          step={1}
          value={value}
          onChange={handleChange}
          aria-label="Month"
          style={{
            position: 'relative',
            width: '100%',
            height: 32,
            appearance: 'none',
            WebkitAppearance: 'none',
            background: 'transparent',
            cursor: 'pointer',
            zIndex: 1,
          }}
          className="month-slider-input"
        />
        <style>{`
          .month-slider-input::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--accent);
            border: 3px solid var(--bg-elevated);
            box-shadow: var(--shadow-md);
            cursor: grab;
          }
          .month-slider-input::-webkit-slider-thumb:active { cursor: grabbing; }
          .month-slider-input::-moz-range-thumb {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--accent);
            border: 3px solid var(--bg-elevated);
            box-shadow: var(--shadow-md);
            cursor: grab;
          }
          .month-slider-input::-webkit-slider-runnable-track {
            background: transparent;
            height: 32px;
          }
          .month-slider-input::-moz-range-track {
            background: transparent;
            height: 32px;
          }
          @media (min-width: 768px) {
            .month-slider-input::-webkit-slider-thumb {
              width: 24px;
              height: 24px;
              border-width: 2px;
            }
            .month-slider-input::-moz-range-thumb {
              width: 24px;
              height: 24px;
              border-width: 2px;
            }
          }
        `}</style>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'var(--s-1)',
      }}>
        <div style={{
          display: 'flex',
          gap: 0,
          flex: 1,
          justifyContent: 'space-between',
          padding: '0 4px',
        }}>
          {MONTH_SHORT.map((m, i) => (
            <span
              key={m}
              style={{
                fontSize: 10,
                color: i + 1 === value ? 'var(--accent)' : 'var(--text-subtle)',
                fontWeight: i + 1 === value ? 'var(--fw-semibold)' : 'var(--fw-regular)',
                textAlign: 'center',
                width: 16,
              }}
            >
              {m[0]}
            </span>
          ))}
        </div>
      </div>
      <div style={{
        fontSize: 'var(--font-sm)',
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginTop: 2,
      }}>
        <strong style={{ color: 'var(--text)' }}>{MONTHS[value - 1]}</strong>
      </div>
    </div>
  );
}

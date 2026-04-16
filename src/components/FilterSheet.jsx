import { useEffect, useState } from 'react';
import { Modal, Button } from './Modal';
import { bump } from '../lib/haptics';

const WHO_OPTIONS = [
  { key: 'couples',     label: 'Couples' },
  { key: 'families',    label: 'Families' },
  { key: 'solo',        label: 'Solo' },
  { key: 'groups',      label: 'Groups' },
  { key: 'backpackers', label: 'Backpackers' },
  { key: 'luxury',      label: 'Luxury' },
];

const COST_OPTIONS = [
  { tier: 1, label: '$' },
  { tier: 2, label: '$$' },
  { tier: 3, label: '$$$' },
];

const CROWD_OPTIONS = [
  { key: 'quiet',     label: 'Quiet' },
  { key: 'balanced',  label: 'Balanced' },
  { key: 'bustling',  label: 'Bustling' },
];

const DEFAULTS = {
  temp_min: 0,
  temp_max: 40,
  sunny_only: false,
  safety_min: 0,
  crowd: null,
  cost_tiers: [],
  language_easy_only: false,
  who: [],
  visa_free_only: false,
  max_flight_hours: 24,
};

export function FilterSheet({ open, onOpenChange, value, onApply, origin }) {
  const [state, setState] = useState({ ...DEFAULTS, ...(value || {}) });

  useEffect(() => {
    if (open) setState({ ...DEFAULTS, ...(value || {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (patch) => setState((s) => ({ ...s, ...patch }));

  const apply = () => {
    onApply?.(state);
    onOpenChange?.(false);
  };

  const reset = () => {
    bump();
    setState({ ...DEFAULTS });
  };

  const visaDisabled = !origin;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Filters"
      footer={
        <>
          <Button variant="ghost" onClick={reset}>Reset</Button>
          <Button onClick={apply}>Apply</Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>

        {/* Climate */}
        <Section title="Climate">
          <Label>
            Temperature: <Value>{state.temp_min}°C – {state.temp_max}°C</Value>
          </Label>
          <DualRange
            min={0}
            max={40}
            low={state.temp_min}
            high={state.temp_max}
            onChange={(lo, hi) => set({ temp_min: lo, temp_max: hi })}
          />
          <ToggleRow
            label="Sunny only"
            checked={state.sunny_only}
            onChange={(v) => set({ sunny_only: v })}
          />
        </Section>

        {/* Safety */}
        <Section title="Safety">
          <Label>
            Minimum safety score: <Value>{state.safety_min}</Value>
          </Label>
          <SingleRange
            min={0}
            max={100}
            value={state.safety_min}
            onChange={(v) => set({ safety_min: v })}
          />
        </Section>

        {/* Crowd */}
        <Section title="Crowd">
          <ChipRow
            options={CROWD_OPTIONS.map((c) => ({ key: c.key, label: c.label }))}
            selected={state.crowd ? [state.crowd] : []}
            onToggle={(k) => set({ crowd: state.crowd === k ? null : k })}
          />
        </Section>

        {/* Cost */}
        <Section title="Cost">
          <ChipRow
            options={COST_OPTIONS.map((c) => ({ key: String(c.tier), label: c.label }))}
            selected={state.cost_tiers.map(String)}
            onToggle={(k) => {
              const tier = Number(k);
              const next = state.cost_tiers.includes(tier)
                ? state.cost_tiers.filter((t) => t !== tier)
                : [...state.cost_tiers, tier].sort();
              set({ cost_tiers: next });
            }}
          />
        </Section>

        {/* Language */}
        <Section title="Language">
          <ToggleRow
            label="English-easy only"
            checked={state.language_easy_only}
            onChange={(v) => set({ language_easy_only: v })}
          />
        </Section>

        {/* Who goes */}
        <Section title="Who goes">
          <ChipRow
            options={WHO_OPTIONS}
            selected={state.who}
            onToggle={(k) => {
              const next = state.who.includes(k)
                ? state.who.filter((w) => w !== k)
                : [...state.who, k];
              set({ who: next });
            }}
          />
        </Section>

        {/* Visa */}
        <Section title="Visa">
          <ToggleRow
            label="Visa-free only"
            checked={state.visa_free_only}
            onChange={(v) => !visaDisabled && set({ visa_free_only: v })}
            disabled={visaDisabled}
            hint={visaDisabled ? 'Set an origin country in settings to enable' : null}
          />
        </Section>

        {/* Flight */}
        <Section title="Flight">
          <Label>
            Max flight hours: <Value>{state.max_flight_hours}h</Value>
          </Label>
          <SingleRange
            min={0}
            max={24}
            value={state.max_flight_hours}
            onChange={(v) => set({ max_flight_hours: v })}
          />
        </Section>
      </div>
    </Modal>
  );
}

/* ---------- subcomponents ---------- */

function Section({ title, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
      <div style={{
        fontSize: 'var(--font-xs)',
        fontWeight: 'var(--fw-semibold)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: 'var(--text-muted)',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text)' }}>
      {children}
    </div>
  );
}

function Value({ children }) {
  return (
    <span style={{ color: 'var(--text-muted)', fontWeight: 'var(--fw-medium)' }}>{children}</span>
  );
}

function ToggleRow({ label, checked, onChange, disabled, hint }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--s-3)',
      opacity: disabled ? 0.5 : 1,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text)' }}>{label}</span>
        {hint && (
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-subtle)' }}>{hint}</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        style={{
          width: 44,
          height: 26,
          borderRadius: 'var(--r-pill)',
          border: 'none',
          background: checked ? 'var(--accent)' : 'var(--border-strong)',
          position: 'relative',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: 0,
          transition: 'background-color var(--dur-fast) var(--ease-out)',
        }}
      >
        <span style={{
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: 'var(--shadow-sm)',
          transition: `left var(--dur-fast) var(--ease-out)`,
        }} />
      </button>
    </div>
  );
}

function ChipRow({ options, selected, onToggle }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-1)' }}>
      {options.map((o) => {
        const active = selected.includes(o.key);
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => { bump(); onToggle?.(o.key); }}
            aria-pressed={active}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--r-pill)',
              border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              background: active ? 'var(--accent)' : 'var(--surface-2)',
              color: active ? 'var(--accent-text)' : 'var(--text)',
              fontSize: 'var(--font-sm)',
              fontWeight: active ? 'var(--fw-semibold)' : 'var(--fw-medium)',
              cursor: 'pointer',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SingleRange({ min, max, value, onChange }) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange?.(Number(e.target.value))}
      style={{
        width: '100%',
        accentColor: 'var(--accent)',
        cursor: 'pointer',
      }}
    />
  );
}

/**
 * Two-thumb range. Implemented with two stacked inputs; the active one is
 * whichever the user last grabbed. Simpler than a custom drag handler and avoids
 * pulling in a dependency.
 */
function DualRange({ min, max, low, high, onChange }) {
  const handleLow = (e) => {
    const v = Math.min(Number(e.target.value), high - 1);
    onChange?.(v, high);
  };
  const handleHigh = (e) => {
    const v = Math.max(Number(e.target.value), low + 1);
    onChange?.(low, v);
  };

  const leftPct  = ((low  - min) / (max - min)) * 100;
  const rightPct = ((high - min) / (max - min)) * 100;

  return (
    <div style={{ position: 'relative', height: 32 }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0, right: 0, top: '50%',
          transform: 'translateY(-50%)',
          height: 4,
          borderRadius: 'var(--r-pill)',
          background: 'var(--border)',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: `${leftPct}%`,
          width: `${rightPct - leftPct}%`,
          top: '50%',
          transform: 'translateY(-50%)',
          height: 4,
          borderRadius: 'var(--r-pill)',
          background: 'var(--accent)',
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={low}
        onChange={handleLow}
        aria-label="Minimum"
        className="plotrip-dual-range"
        style={dualInputStyle}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={high}
        onChange={handleHigh}
        aria-label="Maximum"
        className="plotrip-dual-range"
        style={dualInputStyle}
      />
      <style>{`
        .plotrip-dual-range { pointer-events: none; }
        .plotrip-dual-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          pointer-events: auto;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: var(--accent);
          border: 2px solid var(--bg-elevated);
          box-shadow: var(--shadow-sm);
          cursor: grab;
        }
        .plotrip-dual-range::-moz-range-thumb {
          pointer-events: auto;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: var(--accent);
          border: 2px solid var(--bg-elevated);
          box-shadow: var(--shadow-sm);
          cursor: grab;
        }
        .plotrip-dual-range::-webkit-slider-runnable-track { background: transparent; }
        .plotrip-dual-range::-moz-range-track { background: transparent; }
      `}</style>
    </div>
  );
}

const dualInputStyle = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  appearance: 'none',
  WebkitAppearance: 'none',
  background: 'transparent',
  accentColor: 'var(--accent)',
};

import { useState } from 'react';
import { Button } from '../Modal';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COST_OPTIONS = [
  { label: '$', value: [1] },
  { label: '$$', value: [2] },
  { label: '$$$', value: [3] },
];
const CROWD_OPTIONS = [
  { label: 'Quiet', value: 'low' },
  { label: 'Balanced', value: 'medium' },
  { label: 'Bustling', value: 'high' },
];

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 'var(--r-pill)',
        border: 'none',
        background: active ? 'var(--accent)' : 'var(--bg-elevated)',
        color: active ? 'var(--accent-text)' : 'var(--text)',
        fontSize: 'var(--font-sm)',
        fontWeight: 'var(--fw-medium)',
        cursor: 'pointer',
        transition: 'all var(--dur-fast, 120ms) var(--ease-out)',
      }}
    >
      {label}
    </button>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 'var(--s-4)' }}>
      <div style={{
        fontSize: 'var(--font-xs)',
        fontWeight: 'var(--fw-semibold)',
        color: 'var(--text-secondary)',
        marginBottom: 'var(--s-2)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

export function CriteriaForm({ onSubmit, generating }) {
  const [count, setCount] = useState(5);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [costTiers, setCostTiers] = useState([]);
  const [crowd, setCrowd] = useState(null);

  const toggleCost = (tier) => {
    setCostTiers(prev =>
      prev.includes(tier[0]) ? prev.filter(t => t !== tier[0]) : [...prev, tier[0]]
    );
  };

  const handleSubmit = () => {
    const filters = { month };
    if (costTiers.length > 0) filters.cost_tiers = costTiers;
    if (crowd) filters.crowd = crowd;
    onSubmit(filters, { count, replace: true });
  };

  return (
    <div>
      <Section label="Cities">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
          <button
            type="button"
            onClick={() => setCount(c => Math.max(2, c - 1))}
            disabled={count <= 2}
            style={{
              width: 36, height: 36,
              borderRadius: 'var(--r-md)',
              border: 'none',
              background: 'var(--bg-elevated)',
              color: 'var(--text)',
              fontSize: 'var(--font-lg)',
              cursor: count <= 2 ? 'not-allowed' : 'pointer',
              opacity: count <= 2 ? 0.4 : 1,
            }}
          >
            -
          </button>
          <span style={{ fontSize: 'var(--font-lg)', fontWeight: 'var(--fw-semibold)', minWidth: 24, textAlign: 'center' }}>
            {count}
          </span>
          <button
            type="button"
            onClick={() => setCount(c => Math.min(10, c + 1))}
            disabled={count >= 10}
            style={{
              width: 36, height: 36,
              borderRadius: 'var(--r-md)',
              border: 'none',
              background: 'var(--bg-elevated)',
              color: 'var(--text)',
              fontSize: 'var(--font-lg)',
              cursor: count >= 10 ? 'not-allowed' : 'pointer',
              opacity: count >= 10 ? 0.4 : 1,
            }}
          >
            +
          </button>
        </div>
      </Section>

      <Section label="Month">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {MONTHS.map((m, i) => (
            <Chip
              key={m}
              label={m}
              active={month === i + 1}
              onClick={() => setMonth(i + 1)}
            />
          ))}
        </div>
      </Section>

      <Section label="Budget">
        <div style={{ display: 'flex', gap: 8 }}>
          {COST_OPTIONS.map(opt => (
            <Chip
              key={opt.label}
              label={opt.label}
              active={costTiers.includes(opt.value[0])}
              onClick={() => toggleCost(opt.value)}
            />
          ))}
        </div>
      </Section>

      <Section label="Crowd">
        <div style={{ display: 'flex', gap: 8 }}>
          {CROWD_OPTIONS.map(opt => (
            <Chip
              key={opt.value}
              label={opt.label}
              active={crowd === opt.value}
              onClick={() => setCrowd(prev => prev === opt.value ? null : opt.value)}
            />
          ))}
        </div>
      </Section>

      <div style={{ marginTop: 'var(--s-4)', display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={handleSubmit} disabled={generating}>
          {generating ? 'Generating...' : 'Generate'}
        </Button>
      </div>
    </div>
  );
}

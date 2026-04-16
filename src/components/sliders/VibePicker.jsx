import { bump } from '../../lib/haptics';

export const VIBES = [
  { slug: 'beach',      label: 'Beach',      emoji: '🏖' },
  { slug: 'food',       label: 'Food',       emoji: '🍜' },
  { slug: 'culture',    label: 'Culture',    emoji: '🏛' },
  { slug: 'nature',     label: 'Nature',     emoji: '🌿' },
  { slug: 'mountains',  label: 'Mountains',  emoji: '🏔' },
  { slug: 'nightlife',  label: 'Nightlife',  emoji: '🌃' },
  { slug: 'wellness',   label: 'Wellness',   emoji: '🧘' },
  { slug: 'adventure',  label: 'Adventure',  emoji: '🪂' },
  { slug: 'history',    label: 'History',    emoji: '📜' },
  { slug: 'romantic',   label: 'Romantic',   emoji: '💕' },
  { slug: 'family',     label: 'Family',     emoji: '👨‍👩‍👧' },
  { slug: 'nomad',      label: 'Nomad',      emoji: '💻' },
  { slug: 'festival',   label: 'Festival',   emoji: '🎉' },
];

const MAX = 3;

export function VibePicker({ value = [], onChange }) {
  const selected = Array.isArray(value) ? value : [];

  const toggle = (slug) => {
    const isActive = selected.includes(slug);
    let next;
    if (isActive) {
      next = selected.filter((s) => s !== slug);
    } else {
      if (selected.length >= MAX) {
        // Replace the oldest selection so users aren't stuck — feels more forgiving
        // than silently ignoring the tap.
        next = [...selected.slice(1), slug];
      } else {
        next = [...selected, slug];
      }
    }
    bump();
    onChange?.(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-1)', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          gap: 'var(--s-2)',
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          padding: 'var(--s-1) var(--s-1)',
          margin: '0 calc(var(--s-1) * -1)',
        }}
      >
        {VIBES.map((v) => {
          const active = selected.includes(v.slug);
          const disabled = !active && selected.length >= MAX;
          return (
            <button
              key={v.slug}
              type="button"
              onClick={() => toggle(v.slug)}
              aria-pressed={active}
              style={{
                flex: '0 0 auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--s-1)',
                padding: '8px 14px',
                borderRadius: 'var(--r-pill)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                background: active ? 'var(--accent)' : 'var(--surface-2)',
                color: active ? 'var(--accent-text)' : 'var(--text)',
                fontSize: 'var(--font-sm)',
                fontWeight: active ? 'var(--fw-semibold)' : 'var(--fw-medium)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                opacity: disabled ? 0.45 : 1,
                transition: `background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)`,
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 'var(--font-base)' }}>{v.emoji}</span>
              <span>{v.label}</span>
            </button>
          );
        })}
      </div>
      <div style={{
        fontSize: 'var(--font-xs)',
        color: 'var(--text-subtle)',
        paddingLeft: 'var(--s-1)',
      }}>
        {selected.length === 0 ? 'Pick up to 3 vibes' : `${selected.length} / ${MAX} selected`}
      </div>
    </div>
  );
}

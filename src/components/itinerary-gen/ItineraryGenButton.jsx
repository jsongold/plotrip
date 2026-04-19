import { bump } from '../../lib/haptics';

function WandIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 4V2" />
      <path d="M15 16v-2" />
      <path d="M8 9h2" />
      <path d="M20 9h2" />
      <path d="M17.8 11.8 19 13" />
      <path d="M15 9h.01" />
      <path d="M17.8 6.2 19 5" />
      <path d="M11 6.2 9.7 5" />
      <path d="m3 21 9-9" />
    </svg>
  );
}

export function ItineraryGenButton({ onClick, style }) {
  return (
    <button
      type="button"
      aria-label="Auto-generate itinerary"
      title="Auto-generate itinerary"
      onClick={() => { bump(); onClick(); }}
      style={{
        width: 44, height: 44,
        borderRadius: 'var(--r-lg)',
        border: 'none',
        background: 'var(--surface)',
        color: 'var(--text)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
        pointerEvents: 'auto',
        boxShadow: 'var(--shadow-md)',
        transition: 'all var(--dur-fast, 120ms) var(--ease-out)',
        ...style,
      }}
    >
      <WandIcon />
    </button>
  );
}

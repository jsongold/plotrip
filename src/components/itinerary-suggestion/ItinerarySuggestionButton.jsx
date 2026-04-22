import { bump } from '../../lib/haptics';

function WandIcon({ size = 31 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

export function ItinerarySuggestionButton({ onClick, style }) {
  return (
    <button
      type="button"
      className="map-icon-btn"
      aria-label="Auto-generate itinerary"
      title="Auto-generate itinerary"
      onClick={() => { bump(); onClick(); }}
      style={{ pointerEvents: 'auto', ...style }}
    >
      <WandIcon />
    </button>
  );
}

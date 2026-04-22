import { bump } from '../lib/haptics';

export function LabelToggle({ active, onClick, style }) {
  return (
    <button
      type="button"
      className="map-icon-btn"
      onClick={() => { bump(); onClick(); }}
      aria-label={active ? 'Hide labels' : 'Show labels'}
      aria-pressed={active}
      title={active ? 'Hide labels' : 'Show labels'}
      style={style}
    >
      <svg width={32} height={32} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
          fill="white"
          stroke="#999"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="7" cy="7" r="1" fill="#999" />
      </svg>
    </button>
  );
}

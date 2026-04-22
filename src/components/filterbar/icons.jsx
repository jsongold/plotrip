/**
 * Line-style SVG icons for filter buttons.
 * Thin stroke (1.5), currentColor, transparent fill.
 */

const COMMON = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function FilterSlugIcon({ slug, size = 22 }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', ...COMMON };
  switch (slug) {
    case 'climate':
      return (
        <svg {...props} aria-hidden="true">
          <path d="M14 14.76V3.5a2.5 2.5 0 1 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
        </svg>
      );
    case 'vibes':
      return (
        <svg {...props} aria-hidden="true">
          <path d="M12 3 L13.8 10 L21 12 L13.8 14 L12 21 L10.2 14 L3 12 L10.2 10 Z" />
        </svg>
      );
    case 'crowd':
      return (
        <svg {...props} aria-hidden="true">
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M3 20c0-2.8 2.7-5 6-5s6 2.2 6 5" />
          <path d="M15 15.5c2.8 0 6 1.7 6 4.5" />
        </svg>
      );
    case 'cost':
      return (
        <svg {...props} aria-hidden="true">
          <line x1="12" y1="2" x2="12" y2="22" />
          <path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case 'events':
      return (
        <svg {...props} aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function CalendarIcon({ month }) {
  return (
    <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>
      {month != null ? MONTH_ABBR[(month - 1) % 12] : '---'}
    </span>
  );
}

export function FilterTriIcon({ size = 22 }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', ...COMMON };
  return (
    <svg {...props} aria-hidden="true">
      <line x1="4" y1="6" x2="20" y2="6" />
      <circle cx="9" cy="6" r="2.3" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="15" cy="12" r="2.3" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="7" cy="18" r="2.3" />
    </svg>
  );
}

function strokeProps(size) {
  return {
    width: size, height: size, fill: 'none', stroke: 'currentColor',
    strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
}

export function ModeIcon({ mode, size = 20 }) {
  const stroke = strokeProps(size);
  if (mode === 'flight') return (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
    </svg>
  );
  if (mode === 'train') return (
    <svg viewBox="0 0 24 24" {...stroke}>
      <rect x="4" y="3" width="16" height="14" rx="3"/>
      <line x1="4" y1="11" x2="20" y2="11"/>
      <circle cx="8" cy="14" r="1"/>
      <circle cx="16" cy="14" r="1"/>
      <line x1="6" y1="20" x2="9" y2="17"/>
      <line x1="18" y1="20" x2="15" y2="17"/>
    </svg>
  );
  if (mode === 'bus') return (
    <svg viewBox="0 0 24 24" {...stroke}>
      <rect x="4" y="4" width="16" height="13" rx="2"/>
      <line x1="4" y1="11" x2="20" y2="11"/>
      <circle cx="8" cy="18" r="1.5"/>
      <circle cx="16" cy="18" r="1.5"/>
      <line x1="9" y1="7" x2="15" y2="7"/>
    </svg>
  );
  if (mode === 'car') return (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M5 16h14l-1.5-5.2c-.2-.7-.9-1.3-1.7-1.3H8.2c-.8 0-1.5.6-1.7 1.3L5 16z"/>
      <rect x="3" y="16" width="18" height="3" rx="1"/>
      <circle cx="7.5" cy="19" r="1.5"/>
      <circle cx="16.5" cy="19" r="1.5"/>
    </svg>
  );
  return null;
}

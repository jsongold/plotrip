import { useState } from 'react';

export function ShareIcon({ onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      onClick={() => onClick?.()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '4px', borderRadius: 4, lineHeight: 1,
        display: 'flex', alignItems: 'center', flexShrink: 0,
      }}
      title="Share"
    >
      <svg
        width={16} height={16} viewBox="0 0 24 24" fill="none"
        stroke={hover ? '#2563eb' : '#666'}
        strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
    </button>
  );
}

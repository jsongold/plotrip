export function DestinationToggle({ count, onClick }) {
  return (
    <button
      onClick={onClick}
      title="Show destinations"
      style={{
        position: 'fixed', left: '50%',
        bottom: 'max(calc(80px + env(safe-area-inset-bottom)), calc(var(--dest-sheet-top, 0px) + 10px))',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: 48, height: 48,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0,
        color: 'var(--text-muted)',
      }}
    >
      <svg width={50} height={50} viewBox="0 0 64 64" aria-hidden="true">
        <path
          d="M16 8c-4 0-7 3-7 7v6c0 2 1 3 3 3h2v20c0 4 3 8 8 10v4h6v-4h6v4h6v-4c5-2 8-6 8-10V24h2c2 0 3-1 3-3v-6c0-4-3-7-7-7s-7 3-7 7v3H23v-3c0-4-3-7-7-7z"
          fill="white"
          stroke="#999"
          strokeWidth={2.5}
        />
        <circle cx="24" cy="30" r="3" fill="#999" />
        <circle cx="40" cy="30" r="3" fill="#999" />
        <ellipse cx="32" cy="38" rx="4" ry="3" fill="#999" />
      </svg>
      {count > 0 && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -4, right: -4,
            minWidth: 20, height: 20, padding: '0 5px',
            borderRadius: 10,
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

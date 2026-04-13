export function CityList({ cities, onRemove, onMove, onFork }) {
  if (cities.length === 0) {
    return <p style={{ color: '#999', fontSize: 13, margin: 0 }}>Click a city on the map or search to add stops.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: '0 4px', margin: '8px 0 0' }}>
      {cities.map((c, i) => (
        <li key={`${c.name}-${i}`} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: 8, border: '1px solid #eee', borderRadius: 6,
          marginBottom: 6, background: c.inherited ? '#f0f0ff' : '#fafafa'
        }}>
          <span style={{ fontWeight: 'bold', color: '#2563eb', minWidth: 24, textAlign: 'center' }}>
            {i + 1}
          </span>
          <span style={{ flex: 1, fontSize: 14 }}>
            {c.name}{' '}
            <span style={{ fontSize: 11, color: '#888' }}>
              ({c.lat.toFixed(3)}, {c.lng.toFixed(3)})
            </span>
          </span>
          <span style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => onMove(i, -1)}
              disabled={c.inherited || i === 0}
              style={c.inherited || i === 0 ? { ...iconBtnStyle, opacity: 0.3, cursor: 'default' } : iconBtnStyle}
              title="Move up"
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
            <button
              onClick={() => onMove(i, 1)}
              disabled={c.inherited || i === cities.length - 1}
              style={c.inherited || i === cities.length - 1 ? { ...iconBtnStyle, opacity: 0.3, cursor: 'default' } : iconBtnStyle}
              title="Move down"
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {onFork && (
              <button
                onClick={() => onFork(i)}
                style={iconBtnStyle}
                title="Fork from here"
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="6" y1="3" x2="6" y2="15" />
                  <circle cx="18" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <path d="M18 9a9 9 0 0 1-9 9" />
                </svg>
              </button>
            )}
            <button
              onClick={() => onRemove(i)}
              disabled={c.inherited}
              style={c.inherited ? { ...iconBtnStyle, color: '#dc2626', opacity: 0.3, cursor: 'default' } : { ...iconBtnStyle, color: '#dc2626' }}
              title="Remove"
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}

const iconBtnStyle = {
  width: 28, height: 28, borderRadius: '50%',
  border: '1px solid #eee', background: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', padding: 0
};

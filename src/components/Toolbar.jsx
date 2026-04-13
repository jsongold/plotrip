import { useState } from 'react';

export function Toolbar({ onAdd, onClear, status }) {
  const [input, setInput] = useState('');

  function handleAdd() {
    onAdd(input, () => setInput(''));
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
        placeholder="Enter city name (e.g. Tokyo, Paris, New York)"
        style={{
          flex: 1, minWidth: 160, padding: '8px 10px',
          border: '1px solid #ccc', borderRadius: 6, fontSize: 14
        }}
      />
      <button onClick={handleAdd} title="Add city" style={addBtn}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <button onClick={onClear} title="Clear all" style={clearBtn}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
      {status && <span style={{ fontSize: 12, color: '#666' }}>{status}</span>}
    </div>
  );
}

const circleBtn = {
  width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
};

const addBtn = {
  ...circleBtn, background: '#2563eb', color: '#fff', border: 'none'
};

const clearBtn = {
  ...circleBtn, background: 'none', color: '#dc2626', border: '1px solid #eee'
};

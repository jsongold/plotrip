import { useState, useEffect, useRef } from 'react';

const nameStyle = {
  fontWeight: 'bold',
  fontSize: 15,
  color: '#111',
  padding: '4px 6px',
  borderRadius: 4,
  cursor: 'pointer',
  userSelect: 'none',
};

const inputStyle = {
  border: '1px solid #2563eb',
  outline: 'none',
  background: '#fff',
  fontWeight: 'bold',
  fontSize: 15,
  color: '#111',
  padding: '3px 5px',
  borderRadius: 4,
  minWidth: 40,
};

const LONG_PRESS_MS = 500;

export function EditableName({ value, placeholder, onTap, onRename, title, children }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const timerRef = useRef(null);
  const longPressedRef = useRef(false);

  useEffect(() => { setDraft(value || ''); }, [value]);

  function handlePointerDown() {
    longPressedRef.current = false;
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true;
      setEditing(true);
      setDraft(value || '');
    }, LONG_PRESS_MS);
  }
  function handlePointerUp() {
    clearTimeout(timerRef.current);
    if (!longPressedRef.current && !editing) {
      onTap?.();
    }
  }
  function handlePointerCancel() {
    clearTimeout(timerRef.current);
  }
  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onRename?.(trimmed);
    } else {
      setDraft(value || '');
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onBlur={commit}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
        style={inputStyle}
        size={Math.max(draft.length, 1)}
      />
    );
  }

  return (
    <span
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerCancel}
      onPointerCancel={handlePointerCancel}
      style={nameStyle}
      title={title}
    >
      {children ?? (value || placeholder)}
    </span>
  );
}

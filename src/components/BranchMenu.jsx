import { useEffect, useRef } from 'react';

export function BranchMenu({ open, branches, currentBranchId, onSelect, onNewBranch, onClose, anchorRef }) {
  const fallbackRef = useRef(null);
  const containerRef = anchorRef || fallbackRef;

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose?.();
      }
    }
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [open, onClose, containerRef]);

  if (!open) return null;

  return (
    <div
      ref={anchorRef ? undefined : fallbackRef}
      style={{
        position: 'absolute', top: '100%', left: 0,
        background: '#fff', border: '1px solid #ddd',
        borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        zIndex: 100, minWidth: 160, marginTop: 4,
      }}
    >
      {branches?.map((b) => (
        <div
          key={b.id}
          onClick={() => {
            onClose?.();
            if (b.id !== currentBranchId) onSelect?.(b.id);
          }}
          style={{
            padding: '8px 12px', fontSize: 13, cursor: 'pointer',
            background: b.id === currentBranchId ? '#f0f4ff' : '#fff',
            color: b.id === currentBranchId ? '#2563eb' : '#333',
            fontWeight: b.id === currentBranchId ? 600 : 400,
          }}
        >
          {b.name}
        </div>
      ))}
      <div
        onClick={() => {
          onClose?.();
          onNewBranch?.();
        }}
        style={{
          padding: '8px 12px', fontSize: 13, cursor: 'pointer',
          borderTop: '1px solid #eee',
          color: '#2563eb', fontWeight: 500,
        }}
      >
        + New branch
      </div>
    </div>
  );
}

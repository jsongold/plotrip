import { useState, useRef } from 'react';

export function DestinationSheet({ open, onClose, children }) {
  const [dragY, setDragY] = useState(0);
  const dragStartRef = useRef(null);

  function handlePointerDown(e) {
    dragStartRef.current = e.clientY;
  }
  function handlePointerMove(e) {
    if (dragStartRef.current == null) return;
    const dy = e.clientY - dragStartRef.current;
    if (dy > 0) setDragY(dy);
  }
  function handlePointerUp() {
    if (dragY > 80) {
      onClose();
    }
    setDragY(0);
    dragStartRef.current = null;
  }

  if (!open && dragY === 0) return null;

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      height: '70vh', zIndex: 400,
      background: '#fff', borderTop: '1px solid #ddd',
      borderTopLeftRadius: 12, borderTopRightRadius: 12,
      boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
      display: 'flex', flexDirection: 'column',
      transform: `translateY(${dragY}px)`,
      transition: dragStartRef.current ? 'none' : 'transform 0.2s',
    }}>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          flexShrink: 0, padding: '16px 0 12px',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          cursor: 'grab', touchAction: 'none',
          minHeight: 40,
        }}
      >
        <div style={{
          width: 48, height: 5, borderRadius: 3, background: '#ccc',
        }} />
      </div>
      {children}
    </div>
  );
}

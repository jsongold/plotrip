import { useState, useRef, useEffect } from 'react';

const SHEET_HEIGHT = typeof window !== 'undefined' ? window.innerHeight * 0.7 : 500;
const CLOSE_THRESHOLD = SHEET_HEIGHT * 0.6;
const HALF_POSITION = SHEET_HEIGHT * 0.5;

export function DestinationSheet({ open, onClose, header, children }) {
  const [offsetY, setOffsetY] = useState(0); // 0 = fully open, positive = translated down
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef(null);
  const offsetStartRef = useRef(0);

  // Reset to fully open when sheet becomes open
  useEffect(() => {
    if (open) setOffsetY(0);
  }, [open]);

  function handlePointerDown(e) {
    dragStartRef.current = e.clientY;
    offsetStartRef.current = offsetY;
    setDragging(true);
  }
  function handlePointerMove(e) {
    if (dragStartRef.current == null) return;
    const dy = e.clientY - dragStartRef.current;
    const next = Math.max(0, offsetStartRef.current + dy);
    setOffsetY(next);
  }
  function handlePointerUp() {
    if (dragStartRef.current == null) return;
    dragStartRef.current = null;
    setDragging(false);

    // Snap to nearest: fully open, half, or close
    if (offsetY > CLOSE_THRESHOLD) {
      onClose();
      setOffsetY(0);
    } else if (offsetY > HALF_POSITION * 0.5) {
      setOffsetY(HALF_POSITION);
    } else {
      setOffsetY(0);
    }
  }

  if (!open && offsetY === 0) return null;

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      height: '70vh', zIndex: 400,
      background: '#fff', borderTop: '1px solid #ddd',
      borderTopLeftRadius: 12, borderTopRightRadius: 12,
      boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
      display: 'flex', flexDirection: 'column',
      transform: `translateY(${offsetY}px)`,
      transition: dragging ? 'none' : 'transform 0.25s ease-out',
    }}>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          flexShrink: 0, cursor: 'grab', touchAction: 'none',
        }}
      >
        <div style={{
          padding: '8px 0',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
        }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#ccc' }} />
        </div>
        {header}
      </div>
      {children}
    </div>
  );
}

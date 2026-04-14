import { useState, useRef, useEffect } from 'react';

const SNAP_RATIOS = [0, 0.5]; // 0 = fully open, 0.5 = half closed

export function DestinationSheet({ open, onClose, header, children }) {
  const [offsetY, setOffsetY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(() => typeof window !== 'undefined' ? window.innerHeight * 0.7 : 500);
  const dragStartRef = useRef(null);
  const offsetStartRef = useRef(0);

  useEffect(() => {
    if (open) setOffsetY(0);
  }, [open]);

  useEffect(() => {
    function onResize() {
      setSheetHeight(window.innerHeight * 0.7);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function handlePointerDown(e) {
    dragStartRef.current = e.clientY;
    offsetStartRef.current = offsetY;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
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

    const closeThreshold = sheetHeight * 0.7;
    if (offsetY > closeThreshold) {
      onClose();
      setOffsetY(0);
      return;
    }

    // Snap to nearest point
    const candidates = SNAP_RATIOS.map(r => r * sheetHeight);
    let nearest = candidates[0];
    let minDist = Math.abs(offsetY - nearest);
    for (const c of candidates) {
      const d = Math.abs(offsetY - c);
      if (d < minDist) {
        minDist = d;
        nearest = c;
      }
    }
    setOffsetY(nearest);
  }

  if (!open && offsetY === 0) return null;

  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, bottom: 0,
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
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, overscrollBehavior: 'contain' }}>
        {children}
      </div>
    </div>
  );
}

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
    if (e.target.closest('button, input, [data-no-drag]')) return;
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

  const shouldRender = open || offsetY !== 0;
  const visibleHeight = Math.max(0, sheetHeight - offsetY);

  // Expose sheet's top offset (distance from viewport bottom) as CSS var so
  // floating icons can ride on top of the sheet.
  useEffect(() => {
    const value = shouldRender ? `${visibleHeight}px` : '0px';
    document.documentElement.style.setProperty('--dest-sheet-top', value);
    return () => {
      document.documentElement.style.setProperty('--dest-sheet-top', '0px');
    };
  }, [visibleHeight, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, bottom: 0,
      height: visibleHeight, zIndex: 400,
      background: '#fff', borderTop: 'none',
      borderTopLeftRadius: 12, borderTopRightRadius: 12,
      boxShadow: '0 -4px 24px rgba(0,0,0,0.16)',
      display: 'flex', flexDirection: 'column',
      transition: dragging ? 'none' : 'height 0.25s ease-out',
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
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
        </div>
        {header}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, overscrollBehavior: 'contain' }}>
        {children}
      </div>
    </div>
  );
}

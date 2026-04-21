import { useRef, useEffect } from 'react';
import { Toolbar } from './Toolbar';

export function SearchBar({ onAdd, status, style }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const stop = (e) => e.stopPropagation();
    const events = [
      'touchstart', 'touchmove', 'touchend',
      'mousedown', 'mouseup', 'click', 'dblclick',
      'contextmenu',
    ];
    events.forEach((evt) => el.addEventListener(evt, stop));
    return () => events.forEach((evt) => el.removeEventListener(evt, stop));
  }, []);

  return (
    <div
      ref={ref}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      style={{
        position: 'fixed', left: 0, right: 0,
        bottom: 'calc(24px + env(safe-area-inset-bottom))',
        zIndex: 1000, padding: '0 16px',
        pointerEvents: 'auto',
        ...style,
      }}
    >
      <Toolbar onAdd={onAdd} status={status} />
    </div>
  );
}

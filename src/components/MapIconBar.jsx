export function MapIconBar({ children }) {
  return (
    <div style={{
      position: 'fixed',
      left: 0, right: 0,
      bottom: 'max(calc(80px + env(safe-area-inset-bottom)), calc(var(--dest-sheet-top, 0px) + 10px), calc(var(--rec-carousel-top, 0px) + 10px))',
      zIndex: 1200,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      padding: '0 16px',
      pointerEvents: 'none',
      transition: 'bottom 200ms ease-out',
    }}>
      {children}
    </div>
  );
}

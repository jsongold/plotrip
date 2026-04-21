import { Toolbar } from './Toolbar';

export function SearchBar({ onAdd, status, style }) {
  return (
    <div
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

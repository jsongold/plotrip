import { useMemo } from 'react';
import { mockRoutes } from './mockRoutes';
import { ModeIcon } from './icons';

export function RouteSegment({ from, to }) {
  const routes = useMemo(
    () => mockRoutes(from, to).filter((r) => !r.disabled),
    [from?.id, from?.lat, from?.lng, to?.id, to?.lat, to?.lng]
  );
  if (!from || !to || routes.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      gap: 6,
      overflowX: 'auto',
      padding: '4px 8px 4px 30px',
      margin: '-2px 0 4px',
      scrollbarWidth: 'none',
      WebkitOverflowScrolling: 'touch',
    }}>
      {routes.map((r) => (
        <Chip key={r.mode} route={r} />
      ))}
    </div>
  );
}

function Chip({ route }) {
  return (
    <div style={{
      flex: '0 0 auto',
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '4px 8px',
      borderRadius: 'var(--r-pill)',
      background: 'var(--surface-2, #f1f1f1)',
      color: 'var(--text)',
      fontSize: 11,
      lineHeight: 1.2,
      minHeight: 24,
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)',
        width: 14, height: 14,
      }}>
        <ModeIcon mode={route.mode} size={14} />
      </span>
      <span style={{ color: 'var(--text-muted)' }}>{route.hoursLabel}</span>
      <span style={{ fontWeight: 'var(--fw-semibold)' }}>{route.priceLabel}</span>
    </div>
  );
}

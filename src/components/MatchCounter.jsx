import { Skeleton } from './Skeleton';

export function MatchCounter({ count = 0, loading = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={loading ? 'Loading matches' : `${count} cities match — tap to view list`}
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 500,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--s-2)',
        padding: '8px 14px',
        borderRadius: 'var(--r-pill)',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        color: 'var(--text)',
        fontSize: 'var(--font-sm)',
        fontWeight: 'var(--fw-semibold)',
        boxShadow: 'var(--shadow-md)',
        cursor: 'pointer',
        minHeight: 36,
      }}
    >
      {loading ? (
        <>
          <Skeleton width={20} height={14} radius={4} />
          <span style={{ color: 'var(--text-muted)', fontWeight: 'var(--fw-regular)' }}>
            cities match
          </span>
        </>
      ) : (
        <>
          <span style={{ color: 'var(--accent)' }}>{count}</span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 'var(--fw-regular)' }}>
            {count === 1 ? 'city matches' : 'cities match'}
          </span>
        </>
      )}
    </button>
  );
}

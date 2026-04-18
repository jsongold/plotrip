const toneStyles = {
  error: {
    background: 'var(--danger-weak)',
    border: '1px solid rgba(220,38,38,0.16)',
    color: 'var(--danger)',
  },
  success: {
    background: '#ecfdf3',
    border: '1px solid rgba(22,163,74,0.16)',
    color: 'var(--success)',
  },
  info: {
    background: 'var(--accent-weak)',
    border: '1px solid rgba(37,99,235,0.16)',
    color: 'var(--accent)',
  },
};

export function AuthStatus({ tone = 'info', children }) {
  if (!children) return null;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      style={{
        ...toneStyles[tone],
        borderRadius: 16,
        padding: '12px 14px',
        fontSize: 'var(--font-sm)',
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}


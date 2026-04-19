import { useAuth } from '../../context/AuthContext';

export function AuthActions({ navigate, showDashboardLink = true, compact = false }) {
  const { user, signOut, isSubmitting } = useAuth();

  if (!user) {
    return (
      <div style={rowStyle(compact)}>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={buttonStyle(compact)}
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div style={rowStyle(compact)}>
      <div style={emailChipStyle(compact)} title={user.email || ''}>
        {user.email}
      </div>
      {showDashboardLink && (
        <button
          type="button"
          onClick={() => navigate('/')}
          style={buttonStyle(compact)}
        >
          Dashboard
        </button>
      )}
      <button
        type="button"
        onClick={signOut}
        disabled={isSubmitting}
        style={buttonStyle(compact)}
      >
        {isSubmitting ? 'Signing out...' : 'Sign out'}
      </button>
    </div>
  );
}

function rowStyle(compact) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: compact ? 6 : 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  };
}

function buttonStyle(compact) {
  return {
    background: 'rgba(255,255,255,0.92)',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    padding: compact ? '7px 10px' : '8px 12px',
    borderRadius: 'var(--r-md)',
    fontSize: compact ? '12px' : 'var(--font-sm)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}

function emailChipStyle(compact) {
  return {
    padding: compact ? '7px 10px' : '8px 12px',
    borderRadius: 'var(--r-pill)',
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid var(--border)',
    fontSize: compact ? '12px' : 'var(--font-xs)',
    color: 'var(--text-muted)',
    maxWidth: compact ? 180 : 240,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

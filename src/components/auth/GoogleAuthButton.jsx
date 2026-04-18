import { useAuth } from '../../context/AuthContext';

export function GoogleAuthButton({ children = 'Sign in with Google' }) {
  const { isSubmitting, signInWithGoogle } = useAuth();

  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      disabled={isSubmitting}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 18,
        border: '1px solid var(--border-strong)',
        background: 'var(--bg-elevated)',
        color: 'var(--text)',
        fontSize: 'var(--font-base)',
        fontWeight: 600,
        cursor: isSubmitting ? 'wait' : 'pointer',
        opacity: isSubmitting ? 0.72 : 1,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 22,
          height: 22,
          display: 'inline-grid',
          placeItems: 'center',
          borderRadius: '50%',
          background: 'conic-gradient(from 180deg, #34a853 0 25%, #4285f4 25% 50%, #fbbc05 50% 75%, #ea4335 75% 100%)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        G
      </span>
      {children}
    </button>
  );
}

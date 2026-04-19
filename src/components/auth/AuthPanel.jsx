import { AuthProvider, useAuth, useOptionalAuth } from '../../context/AuthContext';
import { AuthCard } from './AuthCard';
import { EmailAuthForm } from './EmailAuthForm';
import { GoogleAuthButton } from './GoogleAuthButton';
import { AuthStatus } from './AuthStatus';

function AuthenticatedState({ user, onSignOut, signedInContent, title, subtitle }) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 440,
        borderRadius: 24,
        border: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
        boxShadow: '0 28px 80px rgba(23,23,23,0.08)',
        padding: 24,
        display: 'grid',
        gap: 16,
      }}
    >
      <div style={{ display: 'grid', gap: 6 }}>
        <span style={{
          display: 'inline-flex',
          width: 'fit-content',
          padding: '7px 11px',
          borderRadius: 999,
          background: '#ecfdf3',
          color: 'var(--success)',
          fontSize: 12,
          fontWeight: 700,
        }}>
          Signed in
        </span>
        <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.05, letterSpacing: '-0.04em' }}>
          {title}
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {subtitle}
        </p>
      </div>

      <div style={{
        display: 'grid',
        gap: 4,
        padding: 16,
        borderRadius: 18,
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>Account</span>
        <strong style={{ fontSize: 'var(--font-md)', color: 'var(--text)' }}>
          {user?.email || 'Authenticated user'}
        </strong>
      </div>

      {signedInContent ? (
        <div>{typeof signedInContent === 'function' ? signedInContent({ user }) : signedInContent}</div>
      ) : null}

      <button
        type="button"
        onClick={onSignOut}
        style={{
          minHeight: 46,
          borderRadius: 16,
          border: '1px solid var(--border-strong)',
          background: 'transparent',
          color: 'var(--text)',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Sign out
      </button>
    </div>
  );
}

function AuthPanelInner({
  title,
  description,
  signedInTitle,
  signedInSubtitle,
  eyebrow,
  footer,
  signedInContent,
  defaultEmailMode,
}) {
  const {
    isAuthenticated,
    isInitializing,
    isSubmitting,
    user,
    error,
    message,
    signOut,
  } = useAuth();

  if (isInitializing) {
    return (
      <AuthCard eyebrow={eyebrow} title={title} description={description}>
        <AuthStatus tone="info">Checking your session...</AuthStatus>
      </AuthCard>
    );
  }

  if (isAuthenticated) {
    return (
      <AuthenticatedState
        user={user}
        onSignOut={signOut}
        signedInContent={signedInContent}
        title={signedInTitle}
        subtitle={signedInSubtitle}
      />
    );
  }

  return (
      <AuthCard eyebrow={eyebrow} title={title} description={description} footer={footer}>
      <AuthStatus tone="error">{error}</AuthStatus>
      <AuthStatus tone="success">{message}</AuthStatus>
      <AuthStatus tone="info">Choose a sign-in method below.</AuthStatus>
      <GoogleAuthButton />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>or</span>
        <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
      </div>
      <EmailAuthForm defaultMode={defaultEmailMode} />
      {isSubmitting ? <AuthStatus tone="info">Processing authentication...</AuthStatus> : null}
    </AuthCard>
  );
}

export function AuthPanel(props) {
  const auth = useOptionalAuth();

  if (!auth) {
    return (
      <AuthProvider>
        <AuthPanelInner
          title="Sign in to manage your trips"
          description="Use Google or email sign-in to access your saved itineraries."
          signedInTitle="Your account is ready"
          signedInSubtitle="You can now view and manage your saved trips."
          eyebrow="Travel identity"
          defaultEmailMode="magicLink"
          {...props}
        />
      </AuthProvider>
    );
  }

  return (
    <AuthPanelInner
      title="Sign in to manage your trips"
      description="Use Google or email sign-in to access your saved itineraries."
      signedInTitle="Your account is ready"
      signedInSubtitle="You can now view and manage your saved trips."
      eyebrow="Travel identity"
      defaultEmailMode="magicLink"
      {...props}
    />
  );
}

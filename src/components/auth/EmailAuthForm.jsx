import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const MODES = {
  magicLink: {
    label: 'Email link',
    actionLabel: 'Sign in with email link',
    helper: 'Send a sign-in link to your email.',
  },
  otp: {
    label: 'Email code',
    actionLabel: 'Send sign-in code',
    helper: 'Send a one-time sign-in code to your email.',
  },
};

function SegmentedControl({ value, onChange }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        padding: 6,
        borderRadius: 18,
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
      }}
    >
      {Object.entries(MODES).map(([key, option]) => {
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={{
              minHeight: 42,
              border: 'none',
              borderRadius: 14,
              background: selected ? 'var(--bg-elevated)' : 'transparent',
              color: selected ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: 'var(--font-sm)',
              cursor: 'pointer',
              boxShadow: selected ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function EmailAuthForm({ defaultMode = 'magicLink' }) {
  const {
    isSubmitting,
    pendingEmail,
    sendMagicLink,
    sendEmailOtp,
    verifyEmailOtp,
    clearFeedback,
  } = useAuth();
  const [mode, setMode] = useState(defaultMode);
  const [email, setEmail] = useState(pendingEmail);
  const [token, setToken] = useState('');

  const isOtpMode = mode === 'otp';
  const activeMode = useMemo(() => MODES[mode], [mode]);

  async function handlePrimarySubmit(event) {
    event.preventDefault();
    clearFeedback();

    if (isOtpMode) {
      await sendEmailOtp(email);
      return;
    }

    await sendMagicLink(email);
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();
    clearFeedback();
    await verifyEmailOtp(email || pendingEmail, token);
    setToken('');
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gap: 4 }}>
        <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text)' }}>
          Sign in with email
        </div>
        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Choose a sign-in method, then enter your email.
        </div>
      </div>

      <SegmentedControl
        value={mode}
        onChange={(nextMode) => {
          clearFeedback();
          setMode(nextMode);
        }}
      />

      <form onSubmit={handlePrimarySubmit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text)' }}>
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
            required
          />
        </label>

        <div style={{ display: 'grid', gap: 8 }}>
          <button type="submit" disabled={isSubmitting} style={primaryButtonStyle(isSubmitting)}>
            {isSubmitting ? 'Working...' : activeMode.actionLabel}
          </button>
          <p style={helperStyle}>{activeMode.helper}</p>
        </div>
      </form>

      {isOtpMode && pendingEmail ? (
        <form onSubmit={handleVerifyOtp} style={otpFormStyle}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text)' }}>
              Verification code
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="6-digit code"
              style={inputStyle}
              required
            />
          </label>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="submit" disabled={isSubmitting} style={secondaryButtonStyle(isSubmitting)}>
              {isSubmitting ? 'Verifying...' : 'Sign in with code'}
            </button>
            <span style={helperStyle}>Sent to {pendingEmail}</span>
          </div>
        </form>
      ) : null}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  minHeight: 48,
  borderRadius: 16,
  border: '1px solid var(--border-strong)',
  background: 'var(--bg-elevated)',
  color: 'var(--text)',
  fontSize: 'var(--font-base)',
  padding: '0 14px',
  boxSizing: 'border-box',
};

function primaryButtonStyle(disabled) {
  return {
    minHeight: 48,
    border: 'none',
    borderRadius: 16,
    background: 'linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%)',
    color: 'var(--accent-text)',
    fontSize: 'var(--font-base)',
    fontWeight: 600,
    cursor: disabled ? 'wait' : 'pointer',
    opacity: disabled ? 0.72 : 1,
  };
}

function secondaryButtonStyle(disabled) {
  return {
    minHeight: 44,
    padding: '0 16px',
    borderRadius: 14,
    border: '1px solid var(--border-strong)',
    background: 'var(--bg-elevated)',
    color: 'var(--text)',
    fontSize: 'var(--font-sm)',
    fontWeight: 600,
    cursor: disabled ? 'wait' : 'pointer',
    opacity: disabled ? 0.72 : 1,
  };
}

const helperStyle = {
  margin: 0,
  color: 'var(--text-muted)',
  fontSize: 'var(--font-sm)',
  lineHeight: 1.5,
};

const otpFormStyle = {
  paddingTop: 12,
  borderTop: '1px solid var(--border)',
  display: 'grid',
  gap: 12,
};

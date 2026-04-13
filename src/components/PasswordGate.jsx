import { useState } from 'react';
import { checkPassword, markUnlocked } from '../hooks/useTrip';

export function PasswordGate({ trip, onUnlock }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const ok = await checkPassword(trip, input);
      if (ok) {
        markUnlocked(trip.id);
        onUnlock();
      } else {
        setError('Incorrect password');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h2 style={styles.title}>This trip is protected</h2>
        <p style={styles.hint}>Enter the password to continue.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Password"
            autoFocus
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.submit}>
            {loading ? 'Checking...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: '#fff',
    borderRadius: 12,
    padding: '32px 28px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    color: '#111',
  },
  hint: {
    fontSize: 14,
    color: '#666',
    margin: '6px 0 20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ccc',
    borderRadius: 6,
    fontSize: 14,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    margin: '10px 0 0',
  },
  submit: {
    marginTop: 16,
    padding: '12px 0',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
};

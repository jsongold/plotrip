import { useState } from 'react';
import { createTrip } from '../hooks/useTrip';

export function HomePage({ navigate }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { tripId, branchId } = await createTrip(name.trim(), password || null);
      navigate(`/t/${tripId}/b/${branchId}`);
    } catch (err) {
      setError(err.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.title}>plotrip</h1>
        <p style={styles.tagline}>Plan your trip, plot your route.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Trip name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Summer in Europe"
            required
            style={styles.input}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={styles.toggle}
          >
            {showPassword ? 'Remove password protection' : 'Add password protection'}
          </button>

          {showPassword && (
            <>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Optional"
                style={styles.input}
              />
            </>
          )}

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.submit}>
            {loading ? 'Creating...' : 'Create Trip'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 480,
    background: '#fff',
    borderRadius: 12,
    padding: '40px 28px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    margin: 0,
    color: '#111',
    letterSpacing: '-0.5px',
  },
  tagline: {
    fontSize: 15,
    color: '#666',
    margin: '6px 0 28px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#333',
    marginBottom: 4,
    marginTop: 16,
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
  toggle: {
    marginTop: 12,
    padding: 0,
    border: 'none',
    background: 'none',
    color: '#2563eb',
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'left',
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    margin: '12px 0 0',
  },
  submit: {
    marginTop: 24,
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

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🎧</div>
        <h1 style={styles.title}>Join the platform</h1>
        <p style={styles.subtitle}>Create your DJ account and start streaming</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="djsuperstar"
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_]+"
              title="Only letters, numbers, and underscores"
              autoComplete="username"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Display Name</label>
            <input
              style={styles.input}
              type="text"
              name="displayName"
              value={form.displayName}
              onChange={handleChange}
              placeholder="DJ Superstar"
              maxLength={50}
              autoComplete="name"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" style={styles.submitButton} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: '#0a0a0a',
  },
  card: {
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center',
  },
  logo: { fontSize: '2.5rem', marginBottom: '16px' },
  title: { color: '#fff', margin: '0 0 8px', fontSize: '1.6rem', fontWeight: 700 },
  subtitle: { color: '#888', margin: '0 0 32px', fontSize: '0.9rem' },
  error: {
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.4)',
    color: '#f87171',
    borderRadius: '8px',
    padding: '10px 16px',
    marginBottom: '20px',
    fontSize: '0.9rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { textAlign: 'left' },
  label: { display: 'block', color: '#bbb', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 },
  input: {
    width: '100%',
    background: '#0f0f0f',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    color: '#fff',
    padding: '10px 14px',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  submitButton: {
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '8px',
  },
  footer: { color: '#888', fontSize: '0.9rem', marginTop: '24px' },
  link: { color: '#7c3aed', textDecoration: 'none', fontWeight: 600 },
};

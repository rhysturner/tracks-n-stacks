import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        <div style={styles.brand}>
          <span style={styles.logo}>🎧 Tracks-N-Stacks</span>
          <p style={styles.tagline}>The DJ streaming platform.</p>
        </div>
        <div style={styles.links}>
          <Link to="/streams" style={styles.link}>Live Streams</Link>
          <Link to="/mixes" style={styles.link}>Mix Archive</Link>
          <Link to="/djs" style={styles.link}>Find DJs</Link>
        </div>
        <p style={styles.copy}>© {new Date().getFullYear()} Tracks-N-Stacks. Powered by Red5 Pro.</p>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    background: '#0a0a0a',
    borderTop: '1px solid #1a1a2e',
    padding: '40px 24px 24px',
    marginTop: 'auto',
  },
  inner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    alignItems: 'center',
    textAlign: 'center',
  },
  brand: {},
  logo: {
    color: '#7c3aed',
    fontSize: '1.2rem',
    fontWeight: 700,
  },
  tagline: {
    color: '#666',
    margin: '8px 0 0',
    fontSize: '0.85rem',
  },
  links: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  link: {
    color: '#888',
    textDecoration: 'none',
    fontSize: '0.9rem',
    transition: 'color 0.2s',
  },
  copy: {
    color: '#444',
    fontSize: '0.8rem',
    margin: 0,
  },
};

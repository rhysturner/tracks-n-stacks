import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>
        <Link to="/" style={styles.brandLink}>
          🎧 Tracks-N-Stacks
        </Link>
      </div>

      <div style={styles.links}>
        <Link to="/streams" style={styles.link}>Live</Link>
        <Link to="/mixes" style={styles.link}>Mixes</Link>
        <Link to="/djs" style={styles.link}>DJs</Link>
      </div>

      <div style={styles.auth}>
        {user ? (
          <div style={styles.userMenu}>
            <button
              style={styles.avatarButton}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="User menu"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} style={styles.avatar} />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {user.username[0].toUpperCase()}
                </div>
              )}
              <span style={styles.username}>{user.username}</span>
            </button>
            {menuOpen && (
              <div style={styles.dropdown}>
                <Link to={`/dj/${user.username}`} style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                  My Profile
                </Link>
                <Link to="/dashboard" style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                  DJ Dashboard
                </Link>
                <Link to="/settings" style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                  Settings
                </Link>
                <button style={{ ...styles.dropdownItem, ...styles.logoutBtn }} onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={styles.ctaButton}>Start Streaming</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: '60px',
    background: '#0f0f0f',
    borderBottom: '1px solid #1a1a2e',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brand: {
    flex: '0 0 auto',
  },
  brandLink: {
    color: '#7c3aed',
    textDecoration: 'none',
    fontSize: '1.3rem',
    fontWeight: 700,
    letterSpacing: '-0.5px',
  },
  links: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
  },
  link: {
    color: '#ccc',
    textDecoration: 'none',
    fontSize: '0.95rem',
    transition: 'color 0.2s',
  },
  auth: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  ctaButton: {
    background: '#7c3aed',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 600,
    transition: 'background 0.2s',
  },
  userMenu: {
    position: 'relative',
  },
  avatarButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#fff',
    padding: '4px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#7c3aed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.9rem',
  },
  username: {
    fontSize: '0.9rem',
    color: '#ddd',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    minWidth: '180px',
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    marginTop: '8px',
  },
  dropdownItem: {
    display: 'block',
    padding: '12px 16px',
    color: '#ddd',
    textDecoration: 'none',
    fontSize: '0.9rem',
    transition: 'background 0.2s',
  },
  logoutBtn: {
    width: '100%',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    color: '#f87171',
    borderTop: '1px solid #2a2a4a',
  },
};

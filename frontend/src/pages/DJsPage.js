import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import { Link } from 'react-router-dom';

export default function DJsPage() {
  const [djs, setDjs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const fetchDJs = async () => {
      setLoading(true);
      try {
        const params = {};
        if (search) params.search = search;
        const res = await userService.list(params);
        setDjs(res.users || []);
      } catch (err) {
        console.error('Failed to load DJs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDJs();
  }, [search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Discover DJs</h1>
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            style={styles.searchInput}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search DJs..."
          />
          <button type="submit" style={styles.searchButton}>🔍</button>
        </form>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading DJs...</div>
      ) : djs.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🎧</div>
          <h3 style={styles.emptyTitle}>No DJs found</h3>
        </div>
      ) : (
        <div style={styles.grid}>
          {djs.map((dj) => (
            <Link to={`/dj/${dj.username}`} key={dj._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.avatarSection}>
                  {dj.avatarUrl ? (
                    <img src={dj.avatarUrl} alt={dj.username} style={styles.avatar} />
                  ) : (
                    <div style={styles.avatarPlaceholder}>
                      {dj.username[0].toUpperCase()}
                    </div>
                  )}
                  {dj.isStreaming && <div style={styles.liveDot}>● LIVE</div>}
                </div>
                <div style={styles.nameSection}>
                  <div style={styles.displayName}>{dj.displayName || dj.username}</div>
                  <div style={styles.handle}>@{dj.username}</div>
                </div>
              </div>
              {dj.bio && <p style={styles.bio}>{dj.bio.slice(0, 100)}{dj.bio.length > 100 ? '...' : ''}</p>}
              {dj.genres && dj.genres.length > 0 && (
                <div style={styles.genres}>
                  {dj.genres.slice(0, 3).map((g) => <span key={g} style={styles.genreChip}>{g}</span>)}
                </div>
              )}
              <div style={styles.cardStats}>
                <span style={styles.statItem}>{dj.followerCount || 0} followers</span>
                <span style={styles.statItem}>{dj.mixCount || 0} mixes</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' },
  title: { color: '#fff', fontSize: '1.8rem', fontWeight: 800, margin: 0 },
  searchForm: { display: 'flex', gap: '8px' },
  searchInput: {
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    color: '#fff',
    padding: '8px 14px',
    fontSize: '0.9rem',
    outline: 'none',
    width: '240px',
  },
  searchButton: {
    background: '#7c3aed',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    padding: '8px 16px',
    cursor: 'pointer',
  },
  loading: { textAlign: 'center', padding: '60px', color: '#666' },
  empty: { textAlign: 'center', padding: '80px', background: '#1a1a2e', borderRadius: '16px' },
  emptyIcon: { fontSize: '3rem', marginBottom: '16px' },
  emptyTitle: { color: '#fff', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: {
    display: 'block',
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    borderRadius: '16px',
    padding: '20px',
    textDecoration: 'none',
    color: '#fff',
    transition: 'border-color 0.2s',
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  avatarSection: { position: 'relative', flexShrink: 0 },
  avatar: { width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #7c3aed' },
  avatarPlaceholder: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#7c3aed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: '1.2rem',
    border: '2px solid #7c3aed',
  },
  liveDot: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    background: '#ef4444',
    color: '#fff',
    fontSize: '0.55rem',
    fontWeight: 700,
    padding: '1px 5px',
    borderRadius: '4px',
  },
  nameSection: { minWidth: 0 },
  displayName: { color: '#fff', fontWeight: 700, fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  handle: { color: '#888', fontSize: '0.8rem' },
  bio: { color: '#999', fontSize: '0.85rem', lineHeight: 1.4, margin: '0 0 12px' },
  genres: { display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' },
  genreChip: { background: '#2a2a4a', color: '#7c3aed', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 },
  cardStats: { display: 'flex', gap: '12px', paddingTop: '12px', borderTop: '1px solid #2a2a4a' },
  statItem: { color: '#888', fontSize: '0.8rem' },
};

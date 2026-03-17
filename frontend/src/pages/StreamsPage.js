import React, { useState, useEffect } from 'react';
import { streamService } from '../services/api';
import StreamCard from '../components/stream/StreamCard';

const GENRES = ['All', 'House', 'Techno', 'Drum & Bass', 'Jungle', 'Trance', 'Ambient', 'Hip Hop', 'Disco', 'Breaks'];

export default function StreamsPage() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = {};
        if (genre) params.genre = genre;
        const res = await streamService.list(params);
        setStreams(res.streams || []);
        setTotal(res.pagination?.total || 0);
      } catch (err) {
        console.error('Failed to load streams:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
    const interval = setInterval(fetch, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [genre]);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <span style={styles.liveDot}>●</span> Live Streams
          </h1>
          <p style={styles.subtitle}>{total} DJs streaming right now</p>
        </div>
      </div>

      <div style={styles.genres}>
        {GENRES.map((g) => (
          <button
            key={g}
            style={{
              ...styles.genreChip,
              ...(genre === (g === 'All' ? '' : g) ? styles.genreChipActive : {}),
            }}
            onClick={() => setGenre(g === 'All' ? '' : g)}
          >
            {g}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.loading}>Checking for live streams...</div>
      ) : streams.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📡</div>
          <h3 style={styles.emptyTitle}>No live streams right now</h3>
          <p style={styles.emptyText}>
            {genre ? `No ${genre} streams are live. ` : ''}
            Check back soon or be the first to go live!
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {streams.map((stream) => (
            <StreamCard key={stream._id} stream={stream} />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' },
  title: { color: '#fff', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 4px' },
  liveDot: { color: '#ef4444', marginRight: '8px' },
  subtitle: { color: '#888', margin: 0, fontSize: '0.9rem' },
  genres: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' },
  genreChip: {
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    color: '#bbb',
    borderRadius: '20px',
    padding: '6px 16px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  genreChipActive: {
    background: '#7c3aed',
    border: '1px solid #7c3aed',
    color: '#fff',
  },
  loading: { textAlign: 'center', padding: '60px', color: '#666' },
  empty: { textAlign: 'center', padding: '80px 24px', background: '#1a1a2e', borderRadius: '16px', border: '1px solid #2a2a4a' },
  emptyIcon: { fontSize: '3rem', marginBottom: '16px' },
  emptyTitle: { color: '#fff', margin: '0 0 8px' },
  emptyText: { color: '#888', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
};

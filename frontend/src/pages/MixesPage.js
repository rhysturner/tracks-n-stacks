import React, { useState, useEffect } from 'react';
import { mixService } from '../services/api';
import MixCard from '../components/mix/MixCard';

const GENRES = ['All', 'House', 'Techno', 'Drum & Bass', 'Jungle', 'Trance', 'Ambient', 'Hip Hop', 'Disco', 'Breaks'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Played' },
  { value: 'liked', label: 'Most Liked' },
];

export default function MixesPage() {
  const [mixes, setMixes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState('');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const fetchMixes = async () => {
      setLoading(true);
      try {
        const params = { sort, page };
        if (genre) params.genre = genre;
        if (search) params.search = search;
        const res = await mixService.list(params);
        setMixes(res.mixes || []);
        setPagination(res.pagination);
      } catch (err) {
        console.error('Failed to load mixes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMixes();
  }, [genre, sort, search, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Mix Archive</h1>
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            style={styles.searchInput}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search mixes..."
          />
          <button type="submit" style={styles.searchButton}>🔍</button>
        </form>
      </div>

      <div style={styles.filters}>
        <div style={styles.genres}>
          {GENRES.map((g) => (
            <button
              key={g}
              style={{ ...styles.chip, ...(genre === (g === 'All' ? '' : g) ? styles.chipActive : {}) }}
              onClick={() => { setGenre(g === 'All' ? '' : g); setPage(1); }}
            >
              {g}
            </button>
          ))}
        </div>
        <div style={styles.sortRow}>
          <span style={styles.sortLabel}>Sort:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              style={{ ...styles.chip, ...(sort === opt.value ? styles.chipActive : {}) }}
              onClick={() => { setSort(opt.value); setPage(1); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading mixes...</div>
      ) : mixes.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🎵</div>
          <h3 style={styles.emptyTitle}>No mixes found</h3>
          <p style={styles.emptyText}>Try a different genre or search term.</p>
        </div>
      ) : (
        <>
          <div style={styles.grid}>
            {mixes.map((mix) => (
              <MixCard key={mix._id} mix={mix} />
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div style={styles.pagination}>
              <button
                style={styles.pageButton}
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                ← Previous
              </button>
              <span style={styles.pageInfo}>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                style={styles.pageButton}
                disabled={page >= pagination.pages}
                onClick={() => setPage(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
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
    fontSize: '0.9rem',
  },
  filters: { marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' },
  genres: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  sortRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  sortLabel: { color: '#888', fontSize: '0.85rem' },
  chip: {
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    color: '#bbb',
    borderRadius: '20px',
    padding: '6px 14px',
    fontSize: '0.82rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  chipActive: { background: '#7c3aed', border: '1px solid #7c3aed', color: '#fff' },
  loading: { textAlign: 'center', padding: '60px', color: '#666' },
  empty: { textAlign: 'center', padding: '80px 24px', background: '#1a1a2e', borderRadius: '16px', border: '1px solid #2a2a4a' },
  emptyIcon: { fontSize: '3rem', marginBottom: '16px' },
  emptyTitle: { color: '#fff', margin: '0 0 8px' },
  emptyText: { color: '#888', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '40px' },
  pageButton: {
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    color: '#ddd',
    borderRadius: '8px',
    padding: '8px 20px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  pageInfo: { color: '#888', fontSize: '0.9rem' },
};

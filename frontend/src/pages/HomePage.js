import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { streamService, mixService, userService } from '../services/api';
import StreamCard from '../components/stream/StreamCard';
import MixCard from '../components/mix/MixCard';

export default function HomePage() {
  const [liveStreams, setLiveStreams] = useState([]);
  const [recentMixes, setRecentMixes] = useState([]);
  const [topDJs, setTopDJs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [streamsRes, mixesRes, djsRes] = await Promise.all([
          streamService.list({ limit: 6 }),
          mixService.list({ limit: 6, sort: 'newest' }),
          userService.list({ limit: 8 }),
        ]);
        setLiveStreams(streamsRes.streams || []);
        setRecentMixes(mixesRes.mixes || []);
        setTopDJs(djsRes.users || []);
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.page}>
      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            Stream Your Mix.<br />
            <span style={styles.heroAccent}>Build Your Crowd.</span>
          </h1>
          <p style={styles.heroSubtitle}>
            The DJ streaming platform powered by Red5 Pro. Go live in seconds,
            grow your following, and archive your sets.
          </p>
          <div style={styles.heroButtons}>
            <Link to="/register" style={styles.heroCta}>Start Streaming Free</Link>
            <Link to="/streams" style={styles.heroSecondary}>Watch Live →</Link>
          </div>
        </div>
        <div style={styles.heroDecoration}>🎧</div>
      </section>

      {/* Live Now */}
      {liveStreams.length > 0 && (
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.liveDot}>●</span> Live Now
            </h2>
            <Link to="/streams" style={styles.viewAll}>View All →</Link>
          </div>
          <div style={styles.grid}>
            {liveStreams.map((stream) => (
              <StreamCard key={stream._id} stream={stream} />
            ))}
          </div>
        </section>
      )}

      {/* No live streams placeholder */}
      {liveStreams.length === 0 && (
        <section style={styles.section}>
          <div style={styles.emptyLive}>
            <div style={styles.emptyLiveIcon}>📡</div>
            <h3 style={styles.emptyLiveTitle}>No one is live right now</h3>
            <p style={styles.emptyLiveText}>Be the first! Start a live stream from your dashboard.</p>
            <Link to="/dashboard" style={styles.heroCta}>Go Live</Link>
          </div>
        </section>
      )}

      {/* Recent Mixes */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Recent Mixes</h2>
          <Link to="/mixes" style={styles.viewAll}>View All →</Link>
        </div>
        {recentMixes.length > 0 ? (
          <div style={styles.grid}>
            {recentMixes.map((mix) => (
              <MixCard key={mix._id} mix={mix} />
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>No mixes yet. DJs will upload their sets here.</div>
        )}
      </section>

      {/* Top DJs */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Featured DJs</h2>
          <Link to="/djs" style={styles.viewAll}>Browse All →</Link>
        </div>
        <div style={styles.djGrid}>
          {topDJs.map((dj) => (
            <Link to={`/dj/${dj.username}`} key={dj._id} style={styles.djCard}>
              <div style={styles.djAvatar}>
                {dj.avatarUrl ? (
                  <img src={dj.avatarUrl} alt={dj.username} style={styles.djAvatarImg} />
                ) : (
                  <div style={styles.djAvatarPlaceholder}>
                    {dj.username[0].toUpperCase()}
                  </div>
                )}
                {dj.isStreaming && <div style={styles.liveIndicator}>LIVE</div>}
              </div>
              <div style={styles.djInfo}>
                <div style={styles.djName}>{dj.displayName || dj.username}</div>
                <div style={styles.djHandle}>@{dj.username}</div>
                {dj.genres && dj.genres.length > 0 && (
                  <div style={styles.djGenres}>{dj.genres.slice(0, 2).join(' · ')}</div>
                )}
                <div style={styles.djStats}>
                  {dj.followerCount} followers · {dj.mixCount} mixes
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={styles.howSection}>
        <h2 style={styles.sectionTitle}>How It Works</h2>
        <div style={styles.steps}>
          {[
            { icon: '📝', title: 'Create Your Profile', desc: 'Sign up and set up your DJ profile in minutes.' },
            { icon: '🎛️', title: 'Go Live', desc: 'Stream from OBS or any RTMP software to Red5 Pro.' },
            { icon: '🎵', title: 'Archive & Share', desc: 'Your streams are saved as mixes for fans to replay.' },
            { icon: '🌐', title: 'Grow Your Network', desc: 'Followers, likes, and comments build your community.' },
          ].map((step) => (
            <div key={step.title} style={styles.step}>
              <div style={styles.stepIcon}>{step.icon}</div>
              <h3 style={styles.stepTitle}>{step.title}</h3>
              <p style={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: { maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' },
  loading: { textAlign: 'center', padding: '80px', color: '#666' },
  hero: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '80px 0 60px',
    gap: '40px',
  },
  heroContent: { flex: 1, maxWidth: '600px' },
  heroTitle: { fontSize: '3rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: '0 0 16px' },
  heroAccent: { color: '#7c3aed' },
  heroSubtitle: { fontSize: '1.1rem', color: '#999', lineHeight: 1.6, margin: '0 0 32px' },
  heroButtons: { display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' },
  heroCta: {
    background: '#7c3aed',
    color: '#fff',
    padding: '14px 28px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: '1rem',
    display: 'inline-block',
  },
  heroSecondary: { color: '#7c3aed', textDecoration: 'none', fontWeight: 600 },
  heroDecoration: { fontSize: '8rem', opacity: 0.2 },
  section: { marginBottom: '60px' },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  sectionTitle: { fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: 0 },
  viewAll: { color: '#7c3aed', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 },
  liveDot: { color: '#ef4444', marginRight: '8px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  emptyLive: {
    textAlign: 'center',
    padding: '60px 24px',
    background: '#1a1a2e',
    borderRadius: '16px',
    border: '1px solid #2a2a4a',
  },
  emptyLiveIcon: { fontSize: '3rem', marginBottom: '16px' },
  emptyLiveTitle: { color: '#fff', margin: '0 0 8px', fontSize: '1.2rem' },
  emptyLiveText: { color: '#888', margin: '0 0 24px' },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    background: '#1a1a2e',
    borderRadius: '12px',
  },
  djGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px',
  },
  djCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: '#1a1a2e',
    borderRadius: '12px',
    textDecoration: 'none',
    border: '1px solid #2a2a4a',
    color: '#fff',
    transition: 'border-color 0.2s',
  },
  djAvatar: { position: 'relative', flexShrink: 0 },
  djAvatarImg: { width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' },
  djAvatarPlaceholder: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: '#7c3aed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: '1.1rem',
  },
  liveIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    background: '#ef4444',
    color: '#fff',
    fontSize: '0.55rem',
    fontWeight: 700,
    padding: '1px 4px',
    borderRadius: '3px',
  },
  djInfo: { minWidth: 0 },
  djName: { fontWeight: 700, fontSize: '0.9rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  djHandle: { fontSize: '0.75rem', color: '#888' },
  djGenres: { fontSize: '0.72rem', color: '#7c3aed', marginTop: '2px' },
  djStats: { fontSize: '0.72rem', color: '#666', marginTop: '2px' },
  howSection: {
    padding: '60px 0',
    borderTop: '1px solid #1a1a2e',
  },
  steps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '24px',
    marginTop: '32px',
  },
  step: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #2a2a4a',
    textAlign: 'center',
  },
  stepIcon: { fontSize: '2rem', marginBottom: '12px' },
  stepTitle: { color: '#fff', margin: '0 0 8px', fontSize: '1rem' },
  stepDesc: { color: '#888', margin: 0, fontSize: '0.85rem', lineHeight: 1.5 },
};

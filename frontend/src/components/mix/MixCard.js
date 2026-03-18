import React from 'react';
import { Link } from 'react-router-dom';

export default function MixCard({ mix }) {
  const dj = mix.dj || {};
  const duration = mix.durationSeconds
    ? `${Math.floor(mix.durationSeconds / 60)}:${String(mix.durationSeconds % 60).padStart(2, '0')}`
    : null;

  return (
    <Link to={`/mixes/${mix._id}`} style={styles.card}>
      <div style={styles.thumbnail}>
        {mix.thumbnailUrl ? (
          <img src={mix.thumbnailUrl} alt={mix.title} style={styles.thumbnailImg} />
        ) : (
          <div style={styles.thumbnailPlaceholder}>
            <span style={styles.musicIcon}>🎵</span>
          </div>
        )}
        {duration && <div style={styles.duration}>{duration}</div>}
        {mix.sourceType === 'live_recording' && (
          <div style={styles.recordingBadge}>📹 Recorded Live</div>
        )}
      </div>
      <div style={styles.info}>
        <div style={styles.title}>{mix.title}</div>
        <div style={styles.djRow}>
          <div style={styles.djAvatarPlaceholder}>
            {(dj.username || 'D')[0].toUpperCase()}
          </div>
          <span style={styles.djName}>{dj.displayName || dj.username}</span>
        </div>
        {mix.genre && <div style={styles.genre}>{mix.genre}</div>}
        <div style={styles.stats}>
          <span>▶ {mix.playCount || 0}</span>
          <span>♥ {mix.likeCount || 0}</span>
          <span>💬 {mix.commentCount || 0}</span>
        </div>
      </div>
    </Link>
  );
}

const styles = {
  card: {
    display: 'block',
    background: '#1a1a2e',
    borderRadius: '12px',
    overflow: 'hidden',
    textDecoration: 'none',
    color: '#fff',
    border: '1px solid #2a2a4a',
    transition: 'transform 0.2s',
  },
  thumbnail: {
    position: 'relative',
    height: '160px',
    background: '#0d0d1a',
    overflow: 'hidden',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
  },
  musicIcon: {
    fontSize: '2.5rem',
    opacity: 0.4,
  },
  duration: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    background: 'rgba(0,0,0,0.75)',
    color: '#fff',
    fontSize: '0.75rem',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
  },
  recordingBadge: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    background: 'rgba(124, 58, 237, 0.85)',
    color: '#fff',
    fontSize: '0.68rem',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: 600,
  },
  info: {
    padding: '12px',
  },
  title: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#fff',
    marginBottom: '8px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  djRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px',
  },
  djAvatarPlaceholder: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: '#7c3aed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.65rem',
  },
  djName: {
    fontSize: '0.8rem',
    color: '#bbb',
  },
  genre: {
    fontSize: '0.72rem',
    color: '#7c3aed',
    fontWeight: 500,
    marginBottom: '6px',
  },
  stats: {
    display: 'flex',
    gap: '12px',
    fontSize: '0.75rem',
    color: '#666',
  },
};

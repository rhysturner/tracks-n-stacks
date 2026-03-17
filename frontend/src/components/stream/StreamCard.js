import React from 'react';
import { Link } from 'react-router-dom';

export default function StreamCard({ stream }) {
  const dj = stream.dj || {};
  const duration = stream.startedAt
    ? Math.floor((Date.now() - new Date(stream.startedAt)) / 60000)
    : 0;

  return (
    <Link to={`/streams/${stream._id}`} style={styles.card}>
      <div style={styles.thumbnail}>
        {stream.thumbnailUrl ? (
          <img src={stream.thumbnailUrl} alt={stream.title} style={styles.thumbnailImg} />
        ) : (
          <div style={styles.thumbnailPlaceholder}>
            <span style={styles.liveBadge}>● LIVE</span>
          </div>
        )}
        <div style={styles.liveBadgeOverlay}>
          <span style={styles.liveDot}>●</span> LIVE
        </div>
        <div style={styles.viewerCount}>
          👁 {stream.viewerCount || 0}
        </div>
      </div>
      <div style={styles.info}>
        <div style={styles.djRow}>
          <div style={styles.djAvatar}>
            {dj.avatarUrl ? (
              <img src={dj.avatarUrl} alt={dj.username} style={styles.djAvatarImg} />
            ) : (
              <div style={styles.djAvatarPlaceholder}>
                {(dj.username || 'D')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div style={styles.djName}>{dj.displayName || dj.username}</div>
            <div style={styles.duration}>{duration}min ago</div>
          </div>
        </div>
        <div style={styles.title}>{stream.title}</div>
        {stream.genre && <div style={styles.genre}>{stream.genre}</div>}
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
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '1px solid #2a2a4a',
  },
  thumbnail: {
    position: 'relative',
    background: '#0d0d1a',
    height: '180px',
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
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  },
  liveBadge: {
    color: '#ef4444',
    fontWeight: 700,
    fontSize: '1.1rem',
    letterSpacing: '1px',
  },
  liveBadgeOverlay: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    background: 'rgba(239, 68, 68, 0.9)',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '4px',
    letterSpacing: '0.5px',
  },
  liveDot: {
    animation: 'pulse 1.5s infinite',
  },
  viewerCount: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
    fontSize: '0.75rem',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  info: {
    padding: '12px',
  },
  djRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  djAvatar: {},
  djAvatarImg: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  djAvatarPlaceholder: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#7c3aed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.75rem',
  },
  djName: {
    fontSize: '0.8rem',
    color: '#bbb',
    fontWeight: 600,
  },
  duration: {
    fontSize: '0.7rem',
    color: '#666',
  },
  title: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#fff',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  genre: {
    fontSize: '0.75rem',
    color: '#7c3aed',
    fontWeight: 500,
  },
};

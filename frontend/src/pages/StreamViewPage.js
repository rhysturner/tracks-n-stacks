import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { streamService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LiveChat from '../components/stream/LiveChat';

export default function StreamViewPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStream = async () => {
      try {
        const res = await streamService.get(id);
        setStream(res.stream);
      } catch (err) {
        setError(err.message || 'Stream not found');
      } finally {
        setLoading(false);
      }
    };
    fetchStream();
  }, [id]);

  if (loading) return <div style={styles.loading}>Loading stream...</div>;
  if (error) return (
    <div style={styles.errorPage}>
      <div style={styles.errorIcon}>📡</div>
      <h2 style={styles.errorTitle}>{error}</h2>
      <Link to="/streams" style={styles.backLink}>← Back to Live Streams</Link>
    </div>
  );

  const dj = stream?.dj || {};

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        {/* Video Player */}
        <div style={styles.playerSection}>
          <div style={styles.playerWrapper}>
            {stream?.status === 'live' ? (
              <div style={styles.player}>
                {/* Red5 Pro WebRTC Player / HLS Player placeholder */}
                <div style={styles.playerPlaceholder}>
                  <div style={styles.playerIcon}>📡</div>
                  <div style={styles.playerText}>Live stream playing via Red5 Pro</div>
                  <div style={styles.playerSubtext}>
                    WebRTC: <code style={styles.code}>{stream.webrtcPlaybackUrl}</code>
                  </div>
                  <div style={styles.playerSubtext}>
                    HLS: <code style={styles.code}>{stream.playbackUrl}</code>
                  </div>
                  {/* 
                    In production, embed the Red5 Pro WebRTC subscriber here:
                    <red5pro-subscriber
                      host={RED5_HOST}
                      app={RED5_APP}
                      stream-name={stream.red5StreamName}
                    />
                  */}
                </div>
              </div>
            ) : (
              <div style={styles.endedPlayer}>
                <div style={styles.playerIcon}>⏹</div>
                <h3 style={styles.endedText}>This stream has ended</h3>
                {stream?.savedMix && (
                  <Link to={`/mixes/${stream.savedMix}`} style={styles.mixLink}>
                    🎵 Watch the Recording
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Stream Info */}
          <div style={styles.streamInfo}>
            <div style={styles.titleRow}>
              {stream?.status === 'live' && (
                <span style={styles.liveBadge}>● LIVE</span>
              )}
              <h1 style={styles.streamTitle}>{stream?.title}</h1>
            </div>

            <div style={styles.djInfo}>
              <Link to={`/dj/${dj.username}`} style={styles.djLink}>
                <div style={styles.djAvatarPlaceholder}>
                  {(dj.username || 'D')[0].toUpperCase()}
                </div>
                <div>
                  <div style={styles.djName}>{dj.displayName || dj.username}</div>
                  <div style={styles.djHandle}>@{dj.username}</div>
                </div>
              </Link>

              <div style={styles.streamMeta}>
                {stream?.genre && <span style={styles.genre}>{stream.genre}</span>}
                <span style={styles.viewerCount}>👁 {stream?.viewerCount || 0} viewers</span>
              </div>
            </div>

            {stream?.description && (
              <p style={styles.description}>{stream.description}</p>
            )}

            {stream?.tags && stream.tags.length > 0 && (
              <div style={styles.tags}>
                {stream.tags.map((tag) => (
                  <span key={tag} style={styles.tag}>#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Chat */}
        {stream?.chatEnabled && stream?.status === 'live' && (
          <div style={styles.chatPanel}>
            <LiveChat streamId={id} currentUser={user} />
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: '1400px', margin: '0 auto', padding: '24px' },
  loading: { textAlign: 'center', padding: '80px', color: '#666' },
  errorPage: { textAlign: 'center', padding: '80px' },
  errorIcon: { fontSize: '3rem', marginBottom: '16px' },
  errorTitle: { color: '#fff', marginBottom: '24px' },
  backLink: { color: '#7c3aed', textDecoration: 'none', fontWeight: 600 },
  layout: { display: 'flex', gap: '24px', alignItems: 'flex-start' },
  playerSection: { flex: 1, minWidth: 0 },
  playerWrapper: { background: '#000', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', aspectRatio: '16/9' },
  player: { width: '100%', height: '100%' },
  playerPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0a',
    padding: '24px',
    boxSizing: 'border-box',
  },
  playerIcon: { fontSize: '3rem', marginBottom: '16px', opacity: 0.5 },
  playerText: { color: '#888', fontSize: '1rem', marginBottom: '12px' },
  playerSubtext: { color: '#555', fontSize: '0.75rem', marginBottom: '6px', textAlign: 'center' },
  code: { color: '#7c3aed', fontFamily: 'monospace', fontSize: '0.7rem' },
  endedPlayer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0a',
    gap: '16px',
  },
  endedText: { color: '#888', margin: 0 },
  mixLink: {
    background: '#7c3aed',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
  },
  streamInfo: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #2a2a4a',
  },
  titleRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  liveBadge: {
    background: 'rgba(239,68,68,0.2)',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: '6px',
    padding: '3px 10px',
    fontSize: '0.75rem',
    fontWeight: 700,
    flexShrink: 0,
  },
  streamTitle: { color: '#fff', margin: 0, fontSize: '1.3rem', fontWeight: 700 },
  djInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  djLink: { display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' },
  djAvatarPlaceholder: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#7c3aed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: '1rem',
    flexShrink: 0,
  },
  djName: { color: '#fff', fontWeight: 700, fontSize: '1rem' },
  djHandle: { color: '#888', fontSize: '0.8rem' },
  streamMeta: { display: 'flex', alignItems: 'center', gap: '12px' },
  genre: { background: '#2a2a4a', color: '#7c3aed', padding: '3px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 },
  viewerCount: { color: '#888', fontSize: '0.85rem' },
  description: { color: '#aaa', margin: '12px 0', fontSize: '0.9rem', lineHeight: 1.5 },
  tags: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' },
  tag: { color: '#7c3aed', fontSize: '0.8rem', opacity: 0.8 },
  chatPanel: { width: '340px', height: '600px', flexShrink: 0 },
};

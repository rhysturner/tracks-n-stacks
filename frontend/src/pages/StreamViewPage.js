import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Hls from 'hls.js';
import { streamService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LiveChat from '../components/stream/LiveChat';

export default function StreamViewPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playbackError, setPlaybackError] = useState('');
  const videoRef = useRef(null);

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

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !stream?.playbackUrl || stream?.status !== 'live') {
      return undefined;
    }

    setPlaybackError('');
    let hls;

    const onVideoError = () => {
      setPlaybackError('Unable to play this live stream right now.');
    };

    video.addEventListener('error', onVideoError);

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream.playbackUrl;
    } else if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data?.fatal) {
          setPlaybackError('Live playback failed. Try refreshing the page.');
        }
      });

      hls.loadSource(stream.playbackUrl);
      hls.attachMedia(video);
    } else {
      setPlaybackError('Your browser does not support live HLS playback.');
    }

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Autoplay can fail until user interaction; controls allow manual play.
      });
    }

    return () => {
      video.removeEventListener('error', onVideoError);
      if (hls) {
        hls.destroy();
      }
    };
  }, [stream?.playbackUrl, stream?.status]);

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
                <video
                  ref={videoRef}
                  style={styles.video}
                  controls
                  autoPlay
                  playsInline
                />
                {playbackError && (
                  <div style={styles.playerError}>{playbackError}</div>
                )}
                <div style={styles.playerMeta}>
                  <div style={styles.playerSubtext}>
                    WebRTC: <code style={styles.code}>{stream.webrtcPlaybackUrl}</code>
                  </div>
                  <div style={styles.playerSubtext}>
                    HLS: <code style={styles.code}>{stream.playbackUrl}</code>
                  </div>
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
  player: { width: '100%', height: '100%', position: 'relative' },
  video: {
    width: '100%',
    height: '100%',
    background: '#000',
    display: 'block',
  },
  playerMeta: {
    position: 'absolute',
    left: '12px',
    bottom: '12px',
    background: 'rgba(0,0,0,0.65)',
    border: '1px solid rgba(124,58,237,0.35)',
    borderRadius: '8px',
    padding: '8px 10px',
    maxWidth: '92%',
  },
  playerError: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    right: '12px',
    background: 'rgba(239,68,68,0.2)',
    border: '1px solid rgba(239,68,68,0.45)',
    color: '#fecaca',
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '0.8rem',
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

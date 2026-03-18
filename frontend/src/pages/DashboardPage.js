import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { streamService, authService } from '../services/api';

const RED5_HOST = process.env.REACT_APP_RED5_HOST || 'localhost';
const RED5_RTMP_PORT = process.env.REACT_APP_RED5_RTMP_PORT || '1935';
const RED5_APP = process.env.REACT_APP_RED5_APP || 'live';

export default function DashboardPage() {
  const { user, updateUser } = useAuth();
  const [activeStream, setActiveStream] = useState(null);
  const [streamForm, setStreamForm] = useState({
    title: '',
    description: '',
    genre: '',
    tags: '',
    recordingEnabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [streamKeyVisible, setStreamKeyVisible] = useState(false);
  const [streamKey, setStreamKey] = useState('');

  useEffect(() => {
    // Fetch stream key on mount
    const loadStreamKey = async () => {
      try {
        const data = await authService.me();
        if (data.user && data.user.streamKey) {
          setStreamKey(data.user.streamKey);
        }
      } catch {}
    };
    loadStreamKey();
  }, []);

  const rtmpUrl = `rtmp://${RED5_HOST}:${RED5_RTMP_PORT}/${RED5_APP}`;

  const handleStartStream = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tags = streamForm.tags
        ? streamForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const res = await streamService.start({
        title: streamForm.title,
        description: streamForm.description,
        genre: streamForm.genre,
        tags,
        recordingEnabled: streamForm.recordingEnabled,
      });
      setActiveStream(res.stream);
      updateUser({ isStreaming: true });
    } catch (err) {
      setError(err.message || 'Failed to start stream');
    } finally {
      setLoading(false);
    }
  };

  const handleEndStream = async () => {
    if (!activeStream || !window.confirm('End the stream?')) return;
    setLoading(true);
    try {
      await streamService.end(activeStream._id);
      setActiveStream(null);
      updateUser({ isStreaming: false });
    } catch (err) {
      setError(err.message || 'Failed to end stream');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStreamKey = async () => {
    if (!window.confirm('This will invalidate your current stream key. Continue?')) return;
    try {
      const res = await authService.refreshStreamKey();
      setStreamKey(res.streamKey);
    } catch (err) {
      setError(err.message || 'Failed to refresh stream key');
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.pageTitle}>DJ Dashboard</h1>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.layout}>
        {/* Left: Stream control */}
        <div style={styles.mainPanel}>
          {!activeStream ? (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>🎛️ Start a Live Stream</h2>
              <form onSubmit={handleStartStream} style={styles.form}>
                <div style={styles.field}>
                  <label style={styles.label}>Stream Title *</label>
                  <input
                    style={styles.input}
                    type="text"
                    value={streamForm.title}
                    onChange={(e) => setStreamForm({ ...streamForm, title: e.target.value })}
                    placeholder="Saturday Night Deep House Session"
                    required
                    maxLength={100}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    style={{ ...styles.input, height: '80px', resize: 'vertical' }}
                    value={streamForm.description}
                    onChange={(e) => setStreamForm({ ...streamForm, description: e.target.value })}
                    placeholder="What's the vibe tonight?"
                    maxLength={500}
                  />
                </div>
                <div style={styles.row}>
                  <div style={{ ...styles.field, flex: 1 }}>
                    <label style={styles.label}>Genre</label>
                    <input
                      style={styles.input}
                      type="text"
                      value={streamForm.genre}
                      onChange={(e) => setStreamForm({ ...streamForm, genre: e.target.value })}
                      placeholder="House, Techno, D&B..."
                    />
                  </div>
                  <div style={{ ...styles.field, flex: 1 }}>
                    <label style={styles.label}>Tags (comma-separated)</label>
                    <input
                      style={styles.input}
                      type="text"
                      value={streamForm.tags}
                      onChange={(e) => setStreamForm({ ...streamForm, tags: e.target.value })}
                      placeholder="summer, sunset, club"
                    />
                  </div>
                </div>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={streamForm.recordingEnabled}
                    onChange={(e) => setStreamForm({ ...streamForm, recordingEnabled: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={styles.label}>Save recording as a Mix after stream ends</span>
                </label>
                <button type="submit" style={styles.goLiveButton} disabled={loading}>
                  {loading ? 'Starting...' : '🔴 Go Live'}
                </button>
              </form>
            </div>
          ) : (
            <div style={styles.card}>
              <div style={styles.liveHeader}>
                <div style={styles.liveBadge}>● LIVE</div>
                <h2 style={styles.streamTitle}>{activeStream.title}</h2>
              </div>
              <div style={styles.streamStats}>
                <div style={styles.stat}>
                  <div style={styles.statValue}>{activeStream.viewerCount || 0}</div>
                  <div style={styles.statLabel}>Viewers</div>
                </div>
                <div style={styles.stat}>
                  <div style={styles.statValue}>{activeStream.genre || '—'}</div>
                  <div style={styles.statLabel}>Genre</div>
                </div>
              </div>
              <div style={styles.streamInfo}>
                <p style={styles.infoText}>
                  Your stream is live! Check your OBS/streaming software to confirm you are broadcasting.
                </p>
                {activeStream.playbackUrl && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Playback URL:</span>
                    <code style={styles.infoCode}>{activeStream.playbackUrl}</code>
                  </div>
                )}
              </div>
              <button style={styles.endButton} onClick={handleEndStream} disabled={loading}>
                {loading ? 'Ending...' : '⏹ End Stream'}
              </button>
            </div>
          )}
        </div>

        {/* Right: Stream key & OBS setup */}
        <div style={styles.sidePanel}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📡 OBS Setup</h3>
            <div style={styles.field}>
              <label style={styles.label}>RTMP Server URL</label>
              <div style={styles.copyRow}>
                <code style={styles.codeBlock}>{rtmpUrl}</code>
                <button
                  style={styles.copyButton}
                  onClick={() => navigator.clipboard.writeText(rtmpUrl)}
                  title="Copy"
                >
                  📋
                </button>
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Stream Key</label>
              <div style={styles.copyRow}>
                <code style={styles.codeBlock}>
                  {streamKeyVisible ? streamKey : '••••••••••••••••••••'}
                </code>
                <button
                  style={styles.copyButton}
                  onClick={() => setStreamKeyVisible(!streamKeyVisible)}
                  title={streamKeyVisible ? 'Hide' : 'Show'}
                >
                  {streamKeyVisible ? '🙈' : '👁'}
                </button>
                <button
                  style={styles.copyButton}
                  onClick={() => navigator.clipboard.writeText(streamKey)}
                  title="Copy"
                >
                  📋
                </button>
              </div>
              <button style={styles.refreshKeyButton} onClick={handleRefreshStreamKey}>
                🔄 Regenerate Stream Key
              </button>
            </div>
            <div style={styles.helpBox}>
              <strong style={styles.helpTitle}>OBS Settings:</strong>
              <ul style={styles.helpList}>
                <li>Service: Custom</li>
                <li>Server: <code>{rtmpUrl}</code></li>
                <li>Stream Key: (your key above)</li>
                <li>Encoder: H.264, 4500 kbps</li>
                <li>Audio: AAC, 160 kbps</li>
              </ul>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📊 Your Stats</h3>
            <div style={styles.profileStats}>
              <div style={styles.stat}>
                <div style={styles.statValue}>{user?.followerCount || 0}</div>
                <div style={styles.statLabel}>Followers</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statValue}>{user?.mixCount || 0}</div>
                <div style={styles.statLabel}>Mixes</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statValue}>{user?.totalViews || 0}</div>
                <div style={styles.statLabel}>Total Views</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' },
  pageTitle: { color: '#fff', fontSize: '1.8rem', fontWeight: 800, marginBottom: '32px' },
  error: {
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.4)',
    color: '#f87171',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '24px',
  },
  layout: { display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' },
  mainPanel: { flex: '1 1 500px', minWidth: 0 },
  sidePanel: { flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: '16px' },
  card: {
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    borderRadius: '16px',
    padding: '24px',
  },
  cardTitle: { color: '#fff', margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 700 },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: {},
  row: { display: 'flex', gap: '16px' },
  label: { display: 'block', color: '#bbb', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 },
  input: {
    width: '100%',
    background: '#0f0f0f',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    color: '#fff',
    padding: '10px 14px',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  checkboxLabel: { display: 'flex', alignItems: 'center', cursor: 'pointer' },
  goLiveButton: {
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '14px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '8px',
  },
  liveHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  liveBadge: {
    background: 'rgba(239,68,68,0.2)',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '0.8rem',
    fontWeight: 700,
    letterSpacing: '0.5px',
  },
  streamTitle: { color: '#fff', margin: 0, fontSize: '1.1rem', fontWeight: 700 },
  streamStats: { display: 'flex', gap: '24px', marginBottom: '20px' },
  stat: { textAlign: 'center' },
  statValue: { color: '#7c3aed', fontSize: '1.5rem', fontWeight: 700 },
  statLabel: { color: '#888', fontSize: '0.75rem', marginTop: '2px' },
  streamInfo: { marginBottom: '20px' },
  infoText: { color: '#aaa', fontSize: '0.9rem', margin: '0 0 12px' },
  infoRow: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' },
  infoLabel: { color: '#888', fontSize: '0.8rem' },
  infoCode: {
    background: '#0f0f0f',
    color: '#ddd',
    fontSize: '0.75rem',
    padding: '6px 10px',
    borderRadius: '6px',
    wordBreak: 'break-all',
    display: 'block',
  },
  endButton: {
    background: '#374151',
    color: '#fff',
    border: '1px solid #4b5563',
    borderRadius: '10px',
    padding: '12px 24px',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
  },
  copyRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  codeBlock: {
    flex: 1,
    background: '#0f0f0f',
    color: '#ddd',
    fontSize: '0.78rem',
    padding: '8px 12px',
    borderRadius: '6px',
    fontFamily: 'monospace',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
  },
  copyButton: {
    background: '#2a2a4a',
    border: '1px solid #3a3a5a',
    borderRadius: '6px',
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    flexShrink: 0,
  },
  refreshKeyButton: {
    background: 'none',
    border: '1px solid #374151',
    borderRadius: '6px',
    color: '#888',
    padding: '6px 12px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    marginTop: '4px',
  },
  helpBox: {
    background: '#0f0f0f',
    borderRadius: '8px',
    padding: '12px 16px',
    marginTop: '16px',
  },
  helpTitle: { color: '#bbb', fontSize: '0.85rem', display: 'block', marginBottom: '8px' },
  helpList: { color: '#777', fontSize: '0.8rem', margin: 0, paddingLeft: '16px', lineHeight: 1.8 },
  profileStats: { display: 'flex', gap: '16px', justifyContent: 'space-around' },
};

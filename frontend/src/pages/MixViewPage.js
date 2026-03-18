import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mixService, socialService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MixViewPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [mix, setMix] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    const fetchMix = async () => {
      try {
        const [mixRes, commentsRes] = await Promise.all([
          mixService.get(id),
          mixService.getComments(id),
        ]);
        setMix(mixRes.mix);
        setComments(commentsRes.comments || []);
      } catch (err) {
        console.error('Failed to load mix:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMix();
  }, [id]);

  const handleLike = async () => {
    if (!user) return;
    try {
      if (isLiked) {
        await socialService.unlike('mix', id);
        setIsLiked(false);
        setMix((prev) => ({ ...prev, likeCount: (prev.likeCount || 1) - 1 }));
      } else {
        await socialService.like('mix', id);
        setIsLiked(true);
        setMix((prev) => ({ ...prev, likeCount: (prev.likeCount || 0) + 1 }));
      }
    } catch {}
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    setCommentLoading(true);
    try {
      const res = await mixService.addComment(id, { text: commentText });
      setComments((prev) => [res.comment, ...prev]);
      setCommentText('');
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  const formatDuration = (secs) => {
    if (!secs) return null;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (loading) return <div style={styles.loading}>Loading mix...</div>;
  if (!mix) return <div style={styles.loading}>Mix not found.</div>;

  const dj = mix.dj || {};

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        {/* Main Content */}
        <div style={styles.main}>
          {/* Player */}
          <div style={styles.playerWrapper}>
            {mix.thumbnailUrl ? (
              <img src={mix.thumbnailUrl} alt={mix.title} style={styles.thumbnailImg} />
            ) : (
              <div style={styles.playerPlaceholder}>
                <span style={styles.playerIcon}>🎵</span>
                <div style={styles.playerText}>{mix.title}</div>
              </div>
            )}
            {mix.durationSeconds > 0 && (
              <div style={styles.durationBadge}>{formatDuration(mix.durationSeconds)}</div>
            )}
            {mix.sourceType === 'live_recording' && (
              <div style={styles.recordingBadge}>📹 Recorded Live</div>
            )}
            {/* Audio player for actual playback */}
            {mix.playbackUrl && (
              <audio
                controls
                style={styles.audioPlayer}
                src={mix.playbackUrl}
              >
                Your browser does not support the audio element.
              </audio>
            )}
          </div>

          {/* Mix Info */}
          <div style={styles.infoCard}>
            <div style={styles.titleRow}>
              <h1 style={styles.mixTitle}>{mix.title}</h1>
              <button
                style={{ ...styles.likeButton, ...(isLiked ? styles.likedButton : {}) }}
                onClick={handleLike}
                disabled={!user}
                title={user ? (isLiked ? 'Unlike' : 'Like') : 'Login to like'}
              >
                {isLiked ? '♥' : '♡'} {mix.likeCount || 0}
              </button>
            </div>

            <Link to={`/dj/${dj.username}`} style={styles.djLink}>
              <div style={styles.djAvatar}>{(dj.username || 'D')[0].toUpperCase()}</div>
              <div>
                <div style={styles.djName}>{dj.displayName || dj.username}</div>
                <div style={styles.djHandle}>@{dj.username}</div>
              </div>
            </Link>

            <div style={styles.metaRow}>
              {mix.genre && <span style={styles.genre}>{mix.genre}</span>}
              <span style={styles.metaItem}>▶ {mix.playCount || 0} plays</span>
              <span style={styles.metaItem}>💬 {mix.commentCount || 0} comments</span>
              {mix.durationSeconds > 0 && (
                <span style={styles.metaItem}>⏱ {formatDuration(mix.durationSeconds)}</span>
              )}
            </div>

            {mix.description && <p style={styles.description}>{mix.description}</p>}

            {mix.tags && mix.tags.length > 0 && (
              <div style={styles.tags}>
                {mix.tags.map((tag) => <span key={tag} style={styles.tag}>#{tag}</span>)}
              </div>
            )}

            {/* Track List */}
            {mix.trackList && mix.trackList.length > 0 && (
              <div style={styles.trackList}>
                <h3 style={styles.trackListTitle}>Tracklist</h3>
                {mix.trackList.map((track) => (
                  <div key={track.position} style={styles.trackItem}>
                    <span style={styles.trackNum}>{track.position}.</span>
                    <span style={styles.trackName}>{track.artist} — {track.title}</span>
                    {track.timestampSeconds != null && (
                      <span style={styles.trackTime}>{formatDuration(track.timestampSeconds)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div style={styles.commentsSection}>
            <h2 style={styles.commentsTitle}>Comments ({mix.commentCount || 0})</h2>

            {user && (
              <form onSubmit={handleComment} style={styles.commentForm}>
                <textarea
                  style={styles.commentInput}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  maxLength={500}
                  rows={3}
                />
                <button type="submit" style={styles.commentSubmit} disabled={commentLoading || !commentText.trim()}>
                  {commentLoading ? '...' : 'Post Comment'}
                </button>
              </form>
            )}

            {!user && (
              <div style={styles.loginToComment}>
                <Link to="/login" style={styles.loginLink}>Login</Link> to leave a comment.
              </div>
            )}

            <div style={styles.commentsList}>
              {comments.map((comment) => (
                <div key={comment._id} style={styles.commentItem}>
                  <div style={styles.commentAvatar}>
                    {(comment.user?.username || 'U')[0].toUpperCase()}
                  </div>
                  <div style={styles.commentBody}>
                    <div style={styles.commentHeader}>
                      <span style={styles.commentUsername}>{comment.user?.username}</span>
                      {comment.timestampSeconds != null && (
                        <span style={styles.commentTimestamp}>at {formatDuration(comment.timestampSeconds)}</span>
                      )}
                    </div>
                    <p style={styles.commentText}>{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: '960px', margin: '0 auto', padding: '40px 24px' },
  loading: { textAlign: 'center', padding: '80px', color: '#666' },
  layout: {},
  main: { display: 'flex', flexDirection: 'column', gap: '24px' },
  playerWrapper: {
    background: '#0a0a0a',
    borderRadius: '12px',
    overflow: 'hidden',
    position: 'relative',
    minHeight: '240px',
    display: 'flex',
    flexDirection: 'column',
  },
  thumbnailImg: { width: '100%', height: '300px', objectFit: 'cover' },
  playerPlaceholder: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    minHeight: '200px',
  },
  playerIcon: { fontSize: '3rem', marginBottom: '12px', opacity: 0.3 },
  playerText: { color: '#666', fontSize: '1rem' },
  durationBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
    fontSize: '0.8rem',
    padding: '3px 8px',
    borderRadius: '4px',
    fontFamily: 'monospace',
  },
  recordingBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    background: 'rgba(124,58,237,0.85)',
    color: '#fff',
    fontSize: '0.75rem',
    padding: '3px 10px',
    borderRadius: '4px',
    fontWeight: 600,
  },
  audioPlayer: { width: '100%', background: '#1a1a2e' },
  infoCard: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #2a2a4a',
  },
  titleRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' },
  mixTitle: { color: '#fff', margin: 0, fontSize: '1.5rem', fontWeight: 800, flex: 1 },
  likeButton: {
    background: '#2a2a4a',
    border: '1px solid #3a3a5a',
    color: '#bbb',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 700,
    flexShrink: 0,
  },
  likedButton: { color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)' },
  djLink: { display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '16px' },
  djAvatar: {
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
  djName: { color: '#fff', fontWeight: 700, fontSize: '0.95rem' },
  djHandle: { color: '#888', fontSize: '0.8rem' },
  metaRow: { display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' },
  genre: { background: '#2a2a4a', color: '#7c3aed', padding: '3px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 },
  metaItem: { color: '#888', fontSize: '0.85rem' },
  description: { color: '#aaa', fontSize: '0.9rem', lineHeight: 1.6, margin: '12px 0' },
  tags: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  tag: { color: '#7c3aed', fontSize: '0.8rem', opacity: 0.8 },
  trackList: { marginTop: '20px', borderTop: '1px solid #2a2a4a', paddingTop: '16px' },
  trackListTitle: { color: '#fff', margin: '0 0 12px', fontSize: '1rem', fontWeight: 700 },
  trackItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid #1a1a2e' },
  trackNum: { color: '#666', fontSize: '0.8rem', width: '20px', flexShrink: 0 },
  trackName: { color: '#ccc', fontSize: '0.85rem', flex: 1 },
  trackTime: { color: '#7c3aed', fontSize: '0.75rem', fontFamily: 'monospace', flexShrink: 0 },
  commentsSection: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #2a2a4a',
  },
  commentsTitle: { color: '#fff', margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 700 },
  commentForm: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' },
  commentInput: {
    background: '#0f0f0f',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    color: '#fff',
    padding: '10px 14px',
    fontSize: '0.9rem',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  commentSubmit: {
    alignSelf: 'flex-end',
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 20px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
  },
  loginToComment: { color: '#888', fontSize: '0.9rem', marginBottom: '20px' },
  loginLink: { color: '#7c3aed', textDecoration: 'none', fontWeight: 600 },
  commentsList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  commentItem: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  commentAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#2a2a4a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#bbb',
    fontWeight: 700,
    fontSize: '0.85rem',
    flexShrink: 0,
  },
  commentBody: { flex: 1, minWidth: 0 },
  commentHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
  commentUsername: { color: '#ddd', fontWeight: 700, fontSize: '0.85rem' },
  commentTimestamp: { color: '#7c3aed', fontSize: '0.75rem' },
  commentText: { color: '#aaa', margin: 0, fontSize: '0.9rem', lineHeight: 1.5 },
};

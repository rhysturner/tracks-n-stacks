import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { userService, socialService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MixCard from '../components/mix/MixCard';
import StreamCard from '../components/stream/StreamCard';

export default function DJProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [dj, setDj] = useState(null);
  const [mixes, setMixes] = useState([]);
  const [streams, setStreams] = useState([]);
  const [activeTab, setActiveTab] = useState('mixes');
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const [profileRes, mixesRes, streamsRes] = await Promise.all([
          userService.getByUsername(username),
          userService.getUserMixes(username),
          userService.getUserStreams(username),
        ]);
        setDj(profileRes.user);
        setMixes(mixesRes.mixes || []);
        setStreams(streamsRes.streams || []);

        if (currentUser && profileRes.user) {
          try {
            const statusRes = await socialService.getStatus(profileRes.user._id);
            setIsFollowing(statusRes.isFollowing);
          } catch {}
        }
      } catch (err) {
        console.error('Failed to load DJ profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !dj) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await socialService.unfollow(dj._id);
        setIsFollowing(false);
        setDj((prev) => ({ ...prev, followerCount: (prev.followerCount || 1) - 1 }));
      } else {
        await socialService.follow(dj._id);
        setIsFollowing(true);
        setDj((prev) => ({ ...prev, followerCount: (prev.followerCount || 0) + 1 }));
      }
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading profile...</div>;
  if (!dj) return <div style={styles.loading}>DJ not found.</div>;

  const isOwnProfile = currentUser && currentUser.username === username;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.profileHeader}>
        <div style={styles.avatarSection}>
          {dj.avatarUrl ? (
            <img src={dj.avatarUrl} alt={dj.username} style={styles.avatar} />
          ) : (
            <div style={styles.avatarPlaceholder}>
              {dj.username[0].toUpperCase()}
            </div>
          )}
          {dj.isStreaming && <div style={styles.liveLabel}>● LIVE NOW</div>}
        </div>

        <div style={styles.profileInfo}>
          <div style={styles.nameRow}>
            <h1 style={styles.displayName}>{dj.displayName || dj.username}</h1>
            {dj.isVerified && <span style={styles.verified}>✓</span>}
          </div>
          <div style={styles.handle}>@{dj.username}</div>

          {dj.bio && <p style={styles.bio}>{dj.bio}</p>}

          {dj.genres && dj.genres.length > 0 && (
            <div style={styles.genresList}>
              {dj.genres.map((g) => (
                <span key={g} style={styles.genreChip}>{g}</span>
              ))}
            </div>
          )}

          <div style={styles.stats}>
            <div style={styles.stat}>
              <span style={styles.statNum}>{dj.followerCount || 0}</span>
              <span style={styles.statLabel}>Followers</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statNum}>{dj.followingCount || 0}</span>
              <span style={styles.statLabel}>Following</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statNum}>{dj.mixCount || 0}</span>
              <span style={styles.statLabel}>Mixes</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statNum}>{dj.totalViews || 0}</span>
              <span style={styles.statLabel}>Total Plays</span>
            </div>
          </div>

          {!isOwnProfile && currentUser && (
            <button
              style={{ ...styles.followButton, ...(isFollowing ? styles.followingButton : {}) }}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {followLoading ? '...' : isFollowing ? 'Following ✓' : '+ Follow'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === 'mixes' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('mixes')}
        >
          🎵 Mixes ({mixes.length})
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'streams' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('streams')}
        >
          📡 Past Streams ({streams.length})
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'mixes' && (
          mixes.length === 0 ? (
            <div style={styles.empty}>No mixes uploaded yet.</div>
          ) : (
            <div style={styles.grid}>
              {mixes.map((mix) => (
                <MixCard key={mix._id} mix={mix} />
              ))}
            </div>
          )
        )}

        {activeTab === 'streams' && (
          streams.length === 0 ? (
            <div style={styles.empty}>No past streams.</div>
          ) : (
            <div style={styles.grid}>
              {streams.map((stream) => (
                <StreamCard key={stream._id} stream={stream} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' },
  loading: { textAlign: 'center', padding: '80px', color: '#666' },
  profileHeader: {
    display: 'flex',
    gap: '32px',
    marginBottom: '40px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  avatarSection: { position: 'relative', flexShrink: 0 },
  avatar: { width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #7c3aed' },
  avatarPlaceholder: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: '#7c3aed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: '2.5rem',
    border: '3px solid #7c3aed',
  },
  liveLabel: {
    position: 'absolute',
    bottom: '4px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#ef4444',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '8px',
    whiteSpace: 'nowrap',
  },
  profileInfo: { flex: 1, minWidth: 0 },
  nameRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' },
  displayName: { color: '#fff', margin: 0, fontSize: '1.8rem', fontWeight: 800 },
  verified: { color: '#7c3aed', fontWeight: 700, fontSize: '1.2rem' },
  handle: { color: '#888', fontSize: '0.9rem', marginBottom: '12px' },
  bio: { color: '#ccc', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 12px' },
  genresList: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' },
  genreChip: { background: '#2a2a4a', color: '#7c3aed', padding: '3px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 },
  stats: { display: 'flex', gap: '24px', marginBottom: '20px', flexWrap: 'wrap' },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
  statNum: { color: '#fff', fontWeight: 700, fontSize: '1.2rem' },
  statLabel: { color: '#888', fontSize: '0.75rem' },
  followButton: {
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 24px',
    fontSize: '0.95rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  followingButton: { background: '#2a2a4a', color: '#7c3aed', border: '1px solid #7c3aed' },
  tabs: { display: 'flex', gap: '4px', borderBottom: '1px solid #2a2a4a', marginBottom: '32px' },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#888',
    padding: '12px 20px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    transition: 'all 0.2s',
    marginBottom: '-1px',
  },
  tabActive: { color: '#7c3aed', borderBottomColor: '#7c3aed' },
  content: {},
  empty: { textAlign: 'center', padding: '60px', color: '#666', background: '#1a1a2e', borderRadius: '12px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' },
};

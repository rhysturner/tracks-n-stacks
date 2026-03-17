const express = require('express');
const authMiddleware = require('../middleware/auth');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const Mix = require('../models/Mix');
const Stream = require('../models/Stream');
const User = require('../models/User');

const router = express.Router();

// POST /api/social/follow/:userId — follow a DJ
router.post('/follow/:userId', authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.userId;

    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    const existing = await Follow.findOne({ follower: req.user._id, following: targetId });
    if (existing) {
      return res.status(409).json({ message: 'Already following' });
    }

    await Follow.create({ follower: req.user._id, following: targetId });

    // Update counts
    await Promise.all([
      User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: 1 } }),
      User.findByIdAndUpdate(targetId, { $inc: { followerCount: 1 } }),
    ]);

    return res.json({ following: true });
  } catch (err) {
    console.error('Follow error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/social/follow/:userId — unfollow a DJ
router.delete('/follow/:userId', authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.userId;

    const result = await Follow.findOneAndDelete({ follower: req.user._id, following: targetId });
    if (!result) {
      return res.status(404).json({ message: 'Not following' });
    }

    await Promise.all([
      User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: -1 } }),
      User.findByIdAndUpdate(targetId, { $inc: { followerCount: -1 } }),
    ]);

    return res.json({ following: false });
  } catch (err) {
    console.error('Unfollow error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/social/followers/:userId — get follower list
router.get('/followers/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [follows, total] = await Promise.all([
      Follow.find({ following: req.params.userId })
        .populate('follower', 'username displayName avatarUrl isVerified')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Follow.countDocuments({ following: req.params.userId }),
    ]);

    return res.json({
      followers: follows.map((f) => f.follower),
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err) {
    console.error('Get followers error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/social/following/:userId — get following list
router.get('/following/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [follows, total] = await Promise.all([
      Follow.find({ follower: req.params.userId })
        .populate('following', 'username displayName avatarUrl isVerified')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Follow.countDocuments({ follower: req.params.userId }),
    ]);

    return res.json({
      following: follows.map((f) => f.following),
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err) {
    console.error('Get following error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/social/like/:targetType/:targetId — like a mix or stream
router.post('/like/:targetType/:targetId', authMiddleware, async (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    if (!['mix', 'stream'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid target type' });
    }

    const targetModel = targetType === 'mix' ? 'Mix' : 'Stream';

    const existing = await Like.findOne({
      user: req.user._id,
      targetType,
      targetId,
    });
    if (existing) {
      return res.status(409).json({ message: 'Already liked' });
    }

    await Like.create({
      user: req.user._id,
      targetType,
      targetId,
      targetModel,
    });

    // Increment like count on the target document
    if (targetType === 'mix') {
      await Mix.findByIdAndUpdate(targetId, { $inc: { likeCount: 1 } });
    } else {
      await Stream.findByIdAndUpdate(targetId, { $inc: { likeCount: 1 } });
    }

    return res.json({ liked: true });
  } catch (err) {
    console.error('Like error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/social/like/:targetType/:targetId — unlike
router.delete('/like/:targetType/:targetId', authMiddleware, async (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    const result = await Like.findOneAndDelete({
      user: req.user._id,
      targetType,
      targetId,
    });

    if (!result) {
      return res.status(404).json({ message: 'Like not found' });
    }

    if (targetType === 'mix') {
      await Mix.findByIdAndUpdate(targetId, { $inc: { likeCount: -1 } });
    } else {
      await Stream.findByIdAndUpdate(targetId, { $inc: { likeCount: -1 } });
    }

    return res.json({ liked: false });
  } catch (err) {
    console.error('Unlike error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/social/status/:userId — check if authenticated user follows a DJ and has liked items
router.get('/status/:userId', authMiddleware, async (req, res) => {
  try {
    const isFollowing = await Follow.exists({
      follower: req.user._id,
      following: req.params.userId,
    });

    return res.json({ isFollowing: Boolean(isFollowing) });
  } catch (err) {
    console.error('Social status error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const Mix = require('../models/Mix');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const User = require('../models/User');

const router = express.Router();

// GET /api/mixes — list public mixes
router.get('/', async (req, res) => {
  try {
    const { genre, search, dj, page = 1, limit = 20, sort = 'newest' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { visibility: 'public' };
    if (genre) filter.genre = genre;
    if (dj) filter.dj = dj;
    if (search) filter.$text = { $search: search };

    const sortMap = {
      newest: { createdAt: -1 },
      popular: { playCount: -1 },
      liked: { likeCount: -1 },
    };
    const sortOrder = sortMap[sort] || sortMap.newest;

    const [mixes, total] = await Promise.all([
      Mix.find(filter)
        .populate('dj', 'username displayName avatarUrl isVerified')
        .sort(sortOrder)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Mix.countDocuments(filter),
    ]);

    return res.json({
      mixes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('List mixes error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/mixes/feed — personalized feed for authenticated user
router.get('/feed', authMiddleware, async (req, res) => {
  try {
    const Follow = require('../models/Follow');
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Get the DJs this user follows
    const follows = await Follow.find({ follower: req.user._id }).select('following');
    const followingIds = follows.map((f) => f.following);

    const filter = {
      dj: { $in: followingIds },
      visibility: { $in: ['public', 'followers'] },
    };

    const [mixes, total] = await Promise.all([
      Mix.find(filter)
        .populate('dj', 'username displayName avatarUrl isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Mix.countDocuments(filter),
    ]);

    return res.json({
      mixes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('Feed error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/mixes/:id — get a single mix
router.get('/:id', async (req, res) => {
  try {
    const mix = await Mix.findById(req.params.id)
      .populate('dj', 'username displayName avatarUrl isVerified followerCount')
      .lean();

    if (!mix) {
      return res.status(404).json({ message: 'Mix not found' });
    }

    if (mix.visibility === 'private') {
      return res.status(403).json({ message: 'This mix is private' });
    }

    // Increment play count
    await Mix.findByIdAndUpdate(req.params.id, { $inc: { playCount: 1 } });
    await User.findByIdAndUpdate(mix.dj._id, { $inc: { totalViews: 1 } });

    return res.json({ mix });
  } catch (err) {
    console.error('Get mix error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/mixes — create a mix (manual upload metadata)
router.post(
  '/',
  authMiddleware,
  [
    body('title')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be 1-100 characters'),
    body('description').optional().trim().isLength({ max: 500 }),
    body('genre').optional().trim(),
    body('tags').optional().isArray(),
    body('playbackUrl').optional().isURL().withMessage('Valid playback URL required'),
    body('durationSeconds').optional().isInt({ min: 0 }),
    body('visibility')
      .optional()
      .isIn(['public', 'followers', 'private'])
      .withMessage('Visibility must be public, followers, or private'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, description, genre, tags, playbackUrl, durationSeconds, visibility, trackList } =
        req.body;

      const mix = await Mix.create({
        dj: req.user._id,
        title,
        description,
        genre,
        tags: tags || [],
        playbackUrl,
        durationSeconds: durationSeconds || 0,
        visibility: visibility || 'public',
        trackList: trackList || [],
        sourceType: 'upload',
      });

      await User.findByIdAndUpdate(req.user._id, { $inc: { mixCount: 1 } });

      return res.status(201).json({ mix });
    } catch (err) {
      console.error('Create mix error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/mixes/:id — update mix
router.put(
  '/:id',
  authMiddleware,
  [
    body('title').optional().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('genre').optional().trim(),
    body('tags').optional().isArray(),
    body('visibility').optional().isIn(['public', 'followers', 'private']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const mix = await Mix.findById(req.params.id);
      if (!mix) return res.status(404).json({ message: 'Mix not found' });
      if (mix.dj.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const allowedFields = ['title', 'description', 'genre', 'tags', 'visibility', 'trackList', 'thumbnailUrl'];
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) mix[field] = req.body[field];
      });

      await mix.save();
      return res.json({ mix });
    } catch (err) {
      console.error('Update mix error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// DELETE /api/mixes/:id — delete mix
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const mix = await Mix.findById(req.params.id);
    if (!mix) return res.status(404).json({ message: 'Mix not found' });
    if (mix.dj.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await mix.deleteOne();
    await User.findByIdAndUpdate(req.user._id, { $inc: { mixCount: -1 } });

    return res.json({ message: 'Mix deleted' });
  } catch (err) {
    console.error('Delete mix error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/mixes/:id/comments
router.get('/:id/comments', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [comments, total] = await Promise.all([
      Comment.find({ mix: req.params.id })
        .populate('user', 'username displayName avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Comment.countDocuments({ mix: req.params.id }),
    ]);

    return res.json({
      comments,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err) {
    console.error('Get comments error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/mixes/:id/comments
router.post(
  '/:id/comments',
  authMiddleware,
  [
    body('text')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Comment must be 1-500 characters'),
    body('timestampSeconds').optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const mix = await Mix.findById(req.params.id);
      if (!mix) return res.status(404).json({ message: 'Mix not found' });

      const comment = await Comment.create({
        user: req.user._id,
        mix: req.params.id,
        text: req.body.text,
        timestampSeconds: req.body.timestampSeconds,
      });

      await Mix.findByIdAndUpdate(req.params.id, { $inc: { commentCount: 1 } });

      await comment.populate('user', 'username displayName avatarUrl');

      return res.status(201).json({ comment });
    } catch (err) {
      console.error('Add comment error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// DELETE /api/mixes/:id/comments/:commentId
router.delete('/:id/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await comment.deleteOne();
    await Mix.findByIdAndUpdate(req.params.id, { $inc: { commentCount: -1 } });

    return res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('Delete comment error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

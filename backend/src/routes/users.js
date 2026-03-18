const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Mix = require('../models/Mix');
const Stream = require('../models/Stream');

const router = express.Router();

const parsePagination = (query, defaultLimit = 20) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// GET /api/users — search/list DJs
router.get('/', async (req, res) => {
  try {
    const { search, genre } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const filter = {};
    if (search) {
      // Escape regex special characters to prevent ReDoS
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { username: { $regex: escapedSearch, $options: 'i' } },
        { displayName: { $regex: escapedSearch, $options: 'i' } },
      ];
    }
    if (genre) {
      filter.genres = genre;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('username displayName avatarUrl bio genres followerCount mixCount isVerified isStreaming')
        .sort({ followerCount: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:username — get user profile by username
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -streamKey')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:username/mixes — get a user's public mixes
router.get('/:username/mixes', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { page, limit, skip } = parsePagination(req.query);

    const [mixes, total] = await Promise.all([
      Mix.find({ dj: user._id, visibility: 'public' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Mix.countDocuments({ dj: user._id, visibility: 'public' }),
    ]);

    return res.json({
      mixes,
      pagination: { page, limit, total },
    });
  } catch (err) {
    console.error('Get user mixes error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:username/streams — get a user's stream history
router.get('/:username/streams', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { page, limit, skip } = parsePagination(req.query);

    const [streams, total] = await Promise.all([
      Stream.find({ dj: user._id })
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Stream.countDocuments({ dj: user._id }),
    ]);

    return res.json({
      streams,
      pagination: { page, limit, total },
    });
  } catch (err) {
    console.error('Get user streams error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/me/profile — update own profile
router.put(
  '/me/profile',
  authMiddleware,
  [
    body('displayName').optional().trim().isLength({ max: 50 }),
    body('bio').optional().trim().isLength({ max: 500 }),
    body('genres').optional().isArray(),
    body('socialLinks').optional().isObject(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const allowedFields = ['displayName', 'bio', 'genres', 'socialLinks', 'avatarUrl'];
      const updates = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      });

      const user = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true,
      }).select('-password -streamKey');

      return res.json({ user });
    } catch (err) {
      console.error('Update profile error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;

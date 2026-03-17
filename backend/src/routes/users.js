const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Mix = require('../models/Mix');
const Stream = require('../models/Stream');

const router = express.Router();

// GET /api/users — search/list DJs
router.get('/', async (req, res) => {
  try {
    const { search, genre, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
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
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
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

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [mixes, total] = await Promise.all([
      Mix.find({ dj: user._id, visibility: 'public' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Mix.countDocuments({ dj: user._id, visibility: 'public' }),
    ]);

    return res.json({
      mixes,
      pagination: { page: Number(page), limit: Number(limit), total },
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

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [streams, total] = await Promise.all([
      Stream.find({ dj: user._id })
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Stream.countDocuments({ dj: user._id }),
    ]);

    return res.json({
      streams,
      pagination: { page: Number(page), limit: Number(limit), total },
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

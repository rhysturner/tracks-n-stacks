const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
};

const generateToken = (userId) =>
  jwt.sign({ id: userId }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be 3-30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers and underscores'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('displayName')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Display name must not exceed 50 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, email, password, displayName } = req.body;

      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });
      if (existingUser) {
        const field = existingUser.email === email ? 'email' : 'username';
        return res.status(409).json({ message: `${field} already in use` });
      }

      const streamKey = uuidv4().replace(/-/g, '');

      const user = await User.create({
        username,
        email,
        password,
        displayName: displayName || username,
        streamKey,
      });

      const token = generateToken(user._id);

      return res.status(201).json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          streamKey: user.streamKey,
        },
      });
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ message: 'Server error during registration' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password +streamKey');
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken(user._id);

      return res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          streamKey: user.streamKey,
          avatarUrl: user.avatarUrl,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// GET /api/auth/me — get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+streamKey');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ user });
  } catch (err) {
    console.error('Get me error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/refresh-stream-key — regenerate stream key
router.post('/refresh-stream-key', authMiddleware, async (req, res) => {
  try {
    const newStreamKey = uuidv4().replace(/-/g, '');
    await User.findByIdAndUpdate(req.user._id, { streamKey: newStreamKey });
    return res.json({ streamKey: newStreamKey });
  } catch (err) {
    console.error('Refresh stream key error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

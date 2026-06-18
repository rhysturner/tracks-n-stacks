const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');
const Stream = require('../models/Stream');
const Mix = require('../models/Mix');
const User = require('../models/User');
const red5Service = require('../services/red5');

const router = express.Router();

// GET /api/streams — list live streams
router.get('/', async (req, res) => {
  try {
    const { genre, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { status: 'live' };
    if (genre) filter.genre = genre;

    const [streams, total] = await Promise.all([
      Stream.find(filter)
        .populate('dj', 'username displayName avatarUrl isVerified')
        .sort({ viewerCount: -1, startedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Stream.countDocuments(filter),
    ]);

    return res.json({
      streams,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('List streams error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/streams/:id — get single stream
router.get('/:id', async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id)
      .populate('dj', 'username displayName avatarUrl isVerified followerCount')
      .lean();

    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    return res.json({ stream });
  } catch (err) {
    console.error('Get stream error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/streams — start a new live stream
router.post(
  '/',
  authMiddleware,
  [
    body('title')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be 1-100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
    body('genre').optional().trim(),
    body('tags').optional().isArray(),
    body('chatEnabled').optional().isBoolean(),
    body('recordingEnabled').optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Only allow one active stream per DJ
      const existingStream = await Stream.findOne({ dj: req.user._id, status: 'live' });
      if (existingStream) {
        return res.status(409).json({ message: 'You already have an active stream' });
      }

      const { title, description, genre, tags, chatEnabled, recordingEnabled } = req.body;

      // Use the DJ stream key as the Red5 stream name so OBS ingest and playback always match.
      let streamName = req.user.streamKey;

      // Safety fallback for legacy users missing a stream key.
      if (!streamName) {
        streamName = uuidv4().replace(/-/g, '');
        await User.findByIdAndUpdate(req.user._id, { streamKey: streamName });
      }

      const stream = await Stream.create({
        dj: req.user._id,
        title,
        description,
        genre,
        tags: tags || [],
        status: 'live',
        red5StreamName: streamName,
        rtmpUrl: red5Service.getRtmpIngestUrl(streamName),
        playbackUrl: red5Service.getHlsPlaybackUrl(streamName),
        webrtcPlaybackUrl: red5Service.getWebRtcPlaybackUrl(streamName),
        chatEnabled: chatEnabled !== false,
        recordingEnabled: recordingEnabled !== false,
        startedAt: new Date(),
      });

      // Mark user as streaming
      await User.findByIdAndUpdate(req.user._id, { isStreaming: true });

      // Notify followers via socket.io
      if (req.io) {
        req.io.emit('stream_started', {
          streamId: stream._id,
          djId: req.user._id,
          djUsername: req.user.username,
          title,
        });
      }

      return res.status(201).json({ stream });
    } catch (err) {
      console.error('Start stream error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/streams/:id — update stream metadata
router.put(
  '/:id',
  authMiddleware,
  [
    body('title').optional().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('genre').optional().trim(),
    body('tags').optional().isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const stream = await Stream.findById(req.params.id);
      if (!stream) {
        return res.status(404).json({ message: 'Stream not found' });
      }
      if (stream.dj.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const allowedUpdates = ['title', 'description', 'genre', 'tags'];
      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) stream[field] = req.body[field];
      });

      await stream.save();
      return res.json({ stream });
    } catch (err) {
      console.error('Update stream error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// DELETE /api/streams/:id — end a live stream
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }
    if (stream.dj.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    stream.status = 'ended';
    stream.endedAt = new Date();
    await stream.save();

    // Mark user as not streaming
    await User.findByIdAndUpdate(req.user._id, { isStreaming: false });

    // Tell Red5 to disconnect the publisher
    await red5Service.disconnectStream(stream.red5StreamName);

    // If recording is enabled, create a Mix from the recording
    if (stream.recordingEnabled) {
      const recordings = await red5Service.getRecordings(stream.red5StreamName);
      const recordingUrl = recordings && recordings[0] ? recordings[0].url : stream.playbackUrl;

      const mix = await Mix.create({
        dj: req.user._id,
        title: stream.title,
        description: stream.description,
        genre: stream.genre,
        tags: stream.tags,
        playbackUrl: recordingUrl,
        durationSeconds: stream.durationSeconds || 0,
        sourceType: 'live_recording',
        sourceStream: stream._id,
      });

      stream.savedMix = mix._id;
      await stream.save();

      // Update user mix count
      await User.findByIdAndUpdate(req.user._id, { $inc: { mixCount: 1 } });
    }

    // Notify viewers via socket
    if (req.io) {
      req.io.to(`stream:${stream._id}`).emit('stream_ended', {
        streamId: stream._id,
        savedMixId: stream.savedMix,
      });
    }

    return res.json({ message: 'Stream ended', stream });
  } catch (err) {
    console.error('End stream error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/streams/:id/info — get Red5 stream stats
router.get('/:id/info', authMiddleware, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }
    if (stream.dj.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const [isLive, stats] = await Promise.all([
      red5Service.isStreamLive(stream.red5StreamName),
      red5Service.getStreamStats(stream.red5StreamName),
    ]);

    return res.json({ isLive, stats, stream });
  } catch (err) {
    console.error('Stream info error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

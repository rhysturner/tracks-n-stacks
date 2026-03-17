const mongoose = require('mongoose');

const mixSchema = new mongoose.Schema(
  {
    dj: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Mix title is required'],
      trim: true,
      maxlength: [100, 'Title must not exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must not exceed 500 characters'],
      default: '',
    },
    genre: {
      type: String,
      trim: true,
      default: '',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    thumbnailUrl: {
      type: String,
      default: '',
    },
    // Playback info (from Red5 recording or manual upload)
    playbackUrl: {
      type: String,
      default: '',
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    trackList: [{
      position: Number,
      artist: String,
      title: String,
      timestampSeconds: Number,
    }],
    // Source info
    sourceType: {
      type: String,
      enum: ['live_recording', 'upload'],
      default: 'upload',
    },
    sourceStream: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stream',
    },
    // Privacy
    visibility: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public',
      index: true,
    },
    // Engagement
    playCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    shareCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Text index for search
mixSchema.index({ title: 'text', description: 'text', genre: 'text', tags: 'text' });

module.exports = mongoose.model('Mix', mixSchema);

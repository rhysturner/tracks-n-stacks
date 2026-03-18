const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema(
  {
    dj: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Stream title is required'],
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
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended'],
      default: 'live',
      index: true,
    },
    // Red5 Pro stream details
    red5StreamName: {
      type: String,
      default: '',
    },
    rtmpUrl: {
      type: String,
      default: '',
    },
    playbackUrl: {
      type: String,
      default: '',
    },
    webrtcPlaybackUrl: {
      type: String,
      default: '',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    viewerCount: {
      type: Number,
      default: 0,
    },
    peakViewerCount: {
      type: Number,
      default: 0,
    },
    totalViews: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    chatEnabled: {
      type: Boolean,
      default: true,
    },
    recordingEnabled: {
      type: Boolean,
      default: true,
    },
    // If the stream was recorded and saved as a mix
    savedMix: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mix',
    },
  },
  { timestamps: true }
);

// Virtual for stream duration in seconds
streamSchema.virtual('durationSeconds').get(function () {
  if (!this.endedAt) return null;
  return Math.floor((this.endedAt - this.startedAt) / 1000);
});

streamSchema.set('toJSON', { virtuals: true });
streamSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Stream', streamSchema);

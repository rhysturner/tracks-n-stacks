const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mix: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mix',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [500, 'Comment must not exceed 500 characters'],
    },
    // Optional: comment at a specific timestamp in the mix
    timestampSeconds: {
      type: Number,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);

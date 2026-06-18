const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must not exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [50, 'Display name must not exceed 50 characters'],
      default: '',
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio must not exceed 500 characters'],
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    genres: [{
      type: String,
      trim: true,
    }],
    socialLinks: {
      instagram: { type: String, default: '' },
      soundcloud: { type: String, default: '' },
      mixcloud: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },
    streamKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    isStreaming: {
      type: Boolean,
      default: false,
    },
    followerCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
    mixCount: {
      type: Number,
      default: 0,
    },
    totalViews: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      enum: ['dj', 'listener', 'admin'],
      default: 'dj',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    tier: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },
    savedLiveRecordingCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.streamKey;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  tokenCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Auto delete expired tokens
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Token', tokenSchema);
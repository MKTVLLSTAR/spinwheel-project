const mongoose = require('mongoose');

const prizeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  probability: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Prize', prizeSchema);

const mongoose = require('mongoose');

const spinResultSchema = new mongoose.Schema({
  tokenCode: {
    type: String,
    required: true
  },
  prize: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prize',
    required: true
  },
  userAgent: String,
  ipAddress: String
}, {
  timestamps: true
});

module.exports = mongoose.model('SpinResult', spinResultSchema);
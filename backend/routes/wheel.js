const express = require('express');
const Prize = require('../models/Prize');
const Token = require('../models/Token');
const SpinResult = require('../models/SpinResult');
const router = express.Router();

// Get active prizes (public)
router.get('/prizes', async (req, res) => {
  try {
    const prizes = await Prize.find({ isActive: true }).sort({ createdAt: 1 });
    res.json(prizes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Spin wheel (public)
router.post('/spin', async (req, res) => {
  try {
    const { tokenCode } = req.body;
    
    // Validate token
    const token = await Token.findOne({ 
      tokenCode: tokenCode.toUpperCase(),
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!token) {
      return res.status(404).json({ message: 'Invalid or expired token' });
    }
    
    // Get active prizes
    const prizes = await Prize.find({ isActive: true });
    if (prizes.length === 0) {
      return res.status(400).json({ message: 'No prizes available' });
    }
    
    // Calculate random prize based on probability
    const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0);
    const random = Math.random() * totalProbability;
    
    let currentProbability = 0;
    let selectedPrize = prizes[0];
    
    for (const prize of prizes) {
      currentProbability += prize.probability;
      if (random <= currentProbability) {
        selectedPrize = prize;
        break;
      }
    }
    
    // Mark token as used
    token.isUsed = true;
    token.usedAt = new Date();
    await token.save();
    
    // Save spin result
    const spinResult = new SpinResult({
      tokenCode: token.tokenCode,
      prize: selectedPrize._id,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });
    await spinResult.save();
    
    res.json({
      prize: selectedPrize,
      spinId: spinResult._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
const express = require('express');
const Prize = require('../models/Prize');
const SpinResult = require('../models/SpinResult');
const Token = require('../models/Token');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    const totalTokens = await Token.countDocuments();
    const usedTokens = await Token.countDocuments({ isUsed: true });
    const expiredTokens = await Token.countDocuments({ 
      expiresAt: { $lt: new Date() } 
    });
    const totalSpins = await SpinResult.countDocuments();
    
    res.json({
      totalTokens,
      usedTokens,
      expiredTokens,
      availableTokens: totalTokens - usedTokens - expiredTokens,
      totalSpins
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Prize management
router.get('/prizes', auth, async (req, res) => {
  try {
    const prizes = await Prize.find().sort({ createdAt: -1 });
    res.json(prizes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/prizes', auth, async (req, res) => {
  try {
    const prize = new Prize(req.body);
    await prize.save();
    res.status(201).json(prize);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/prizes/:id', auth, async (req, res) => {
  try {
    const prize = await Prize.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    if (!prize) {
      return res.status(404).json({ message: 'Prize not found' });
    }
    res.json(prize);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/prizes/:id', auth, async (req, res) => {
  try {
    const prize = await Prize.findByIdAndDelete(req.params.id);
    if (!prize) {
      return res.status(404).json({ message: 'Prize not found' });
    }
    res.json({ message: 'Prize deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Spin results
router.get('/results', auth, async (req, res) => {
  try {
    const results = await SpinResult.find()
      .populate('prize')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
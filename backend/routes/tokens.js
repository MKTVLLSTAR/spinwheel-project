const express = require('express');
const Token = require('../models/Token');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Generate random token code
const generateTokenCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Create tokens (admin/superadmin)
router.post('/create', auth, async (req, res) => {
  try {
    const { quantity = 1 } = req.body;
    
    if (quantity < 1 || quantity > 100) {
      return res.status(400).json({ message: 'Quantity must be between 1 and 100' });
    }

    const tokens = [];
    for (let i = 0; i < quantity; i++) {
      let tokenCode;
      let isUnique = false;
      
      // Ensure unique token code
      while (!isUnique) {
        tokenCode = generateTokenCode();
        const existing = await Token.findOne({ tokenCode });
        if (!existing) isUnique = true;
      }
      
      tokens.push({
        tokenCode,
        createdBy: req.user._id
      });
    }

    const createdTokens = await Token.insertMany(tokens);
    
    res.status(201).json({
      message: `${quantity} token(s) created successfully`,
      tokens: createdTokens.map(t => ({
        id: t._id,
        tokenCode: t.tokenCode,
        expiresAt: t.expiresAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all tokens (admin/superadmin)
router.get('/', auth, async (req, res) => {
  try {
    const tokens = await Token.find()
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Validate token (public)
router.post('/validate', async (req, res) => {
  try {
    const { tokenCode } = req.body;
    
    const token = await Token.findOne({ 
      tokenCode: tokenCode.toUpperCase(),
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!token) {
      return res.status(404).json({ message: 'Invalid or expired token' });
    }
    
    res.json({ valid: true, tokenId: token._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
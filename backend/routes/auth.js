const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create admin (superadmin only)
router.post('/create-admin', auth, requireRole(['superadmin']), async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const admin = new User({
      username,
      password,
      role: 'admin',
      createdBy: req.user._id
    });

    await admin.save();

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all admins (superadmin only)
router.get('/admins', auth, requireRole(['superadmin']), async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' })
      .select('-password')
      .populate('createdBy', 'username');
    
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete admin (superadmin only)
router.delete('/admin/:id', auth, requireRole(['superadmin']), async (req, res) => {
  try {
    const admin = await User.findOneAndDelete({ 
      _id: req.params.id, 
      role: 'admin' 
    });
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
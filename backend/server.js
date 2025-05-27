require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const User = require('./models/User');

// Import routes
const authRoutes = require('./routes/auth');
const tokenRoutes = require('./routes/tokens');
const wheelRoutes = require('./routes/wheel');
const adminRoutes = require('./routes/admin');

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/wheel', wheelRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Create superadmin on startup
const createSuperAdmin = async () => {
  try {
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    
    if (!existingSuperAdmin) {
      const superAdmin = new User({
        username: process.env.SUPERADMIN_USERNAME,
        password: process.env.SUPERADMIN_PASSWORD,
        role: 'superadmin'
      });
      
      await superAdmin.save();
      console.log('SuperAdmin created successfully');
    }
  } catch (error) {
    console.error('Error creating SuperAdmin:', error);
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await createSuperAdmin();
});

module.exports = app;
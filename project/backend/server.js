const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initializeFirebase } = require('./config/firebase');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const adminProjectRoutes = require('./routes/adminProjects');
const applicationRoutes = require('./routes/applications');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5001;

console.log('🚀 Starting Projectify Backend Server...');
console.log('⏳ Initializing services...');

// Initialize Firebase
initializeFirebase();

// Security middleware
app.use(helmet());
console.log('🛡️  Security middleware (Helmet) loaded');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);
console.log('⚡ Rate limiting middleware loaded');

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://projectify-rrv0.vercel.app', // Add your Vercel domain here
    'https://projectify-edu.netlify.app', // Add your Netlify domain here
    'http://localhost:5173' // Keep local development
  ],
  credentials: true
}));
console.log('🌐 CORS middleware loaded');

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
console.log('📝 Body parsing middleware loaded');

// Root endpoint with welcome message
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 Welcome to Projectify Backend API!',
    version: '1.0.0',
    status: 'running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
          endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        projects: '/api/projects',
        'admin-projects': '/api/admin-projects',
        applications: '/api/applications',
        analytics: '/api/analytics',
        users: '/api/users'
      }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '✅ Server is running and healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    firebase: 'connected',
    port: PORT
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/admin-projects', adminProjectRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

console.log('📡 API Routes loaded successfully:');
console.log('   🔐 /api/auth - Authentication routes');
console.log('   📋 /api/projects - Project management');
console.log('   🚀 /api/admin-projects - Admin project creation with notifications');
console.log('   📝 /api/applications - Application handling');
console.log('   📊 /api/analytics - Analytics & reports');
console.log('   👥 /api/users - User management');

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '❌ Route not found',
    availableEndpoints: [
      'GET / - Welcome message',
      'GET /api/health - Health check',
      'POST /api/auth/register - User registration',
      'POST /api/auth/login - User login',
      'GET /api/users - Get all users (admin only)',
      'GET /api/projects - Get projects',
      'POST /api/projects - Create project (admin only)',
      'GET /api/applications - Get applications (admin only)',
      'GET /api/analytics/dashboard - Dashboard stats (admin only)'
    ],
    tip: 'Make sure you are using the correct port (5001) and endpoint path'
  });
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 PROJECTIFY BACKEND SERVER STARTED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Port: ${PORT}`);
  console.log('='.repeat(60));
});
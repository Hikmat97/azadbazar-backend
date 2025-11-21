const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
const corsOptions = {
  origin: isProduction 
    ? ['https://your-frontend-domain.com'] // Update with actual domain
    : '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging (use 'combined' in production)
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'azdbzr API',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint (for Render)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const listingRoutes = require('./routes/listingRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = isProduction 
    ? 'An error occurred' 
    : err.message;
  
  res.status(statusCode).json({ 
    error: message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

module.exports = app;
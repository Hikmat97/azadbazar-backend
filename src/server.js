const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { testConnection } = require('./config/database');
const syncDatabase = require('./config/syncDatabase');
const setupSocket = require('./socket');
const { setupNotificationJobs } = require('./jobs/notificationJobs');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = http.createServer(app);

// Socket.io with production-ready CORS
const io = new Server(server, {
  cors: {
    origin: NODE_ENV === 'production' 
      ? ['https://your-frontend-domain.com'] // Update with your actual frontend URL
      : '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

setupSocket(io);
app.set('io', io);

const startServer = async () => {
  try {
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`🔧 Node version: ${process.version}`);
    
    // Test database connection
    await testConnection();
    
    // Sync database (use { alter: false } in production)
    await syncDatabase();
    
    // Setup notification cron jobs (only in production)
    if (NODE_ENV === 'production') {
      setupNotificationJobs();
      console.log('🔔 Notification jobs scheduled');
    }
    
    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.io ready`);
      console.log(`✅ Server started successfully`);
    });

    // Graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handler
const gracefulShutdown = () => {
  console.log('🛑 Received shutdown signal, closing server gracefully...');
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();
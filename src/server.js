





// const http = require('http');
// const { Server } = require('socket.io');
// const app = require('./app');
// const { testConnection } = require('./config/database');
// const syncDatabase = require('./config/syncDatabase');
// const setupSocket = require('./socket');
// require('dotenv').config();

// const PORT = process.env.PORT || 5000;

// // Create HTTP server
// const server = http.createServer(app);

// // Setup Socket.io
// const io = new Server(server, {
//   cors: {
//     origin: '*',
//     methods: ['GET', 'POST']
//   }
// });

// // Initialize Socket.io
// setupSocket(io);

// // Make io accessible to routes
// app.set('io', io);

// const startServer = async () => {
//   try {
//     await testConnection();
//     await syncDatabase();
    
//     server.listen(PORT, () => {
//       console.log(`🚀 Server running on port ${PORT}`);
//       console.log(`📡 Socket.io ready`);
//       console.log(`📡 Environment: ${process.env.NODE_ENV}`);
//     });
//   } catch (error) {
//     console.error('Failed to start server:', error);
//     process.exit(1);
//   }
// };

// startServer();





const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { testConnection } = require('./config/database');
const syncDatabase = require('./config/syncDatabase');
const setupSocket = require('./socket');
const { setupNotificationJobs } = require('./jobs/notificationJobs');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setupSocket(io);
app.set('io', io);

const startServer = async () => {
  try {
    await testConnection();
    await syncDatabase();
    
    // Setup notification cron jobs
    setupNotificationJobs();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.io ready`);
      console.log(`🔔 Notification jobs scheduled`);
      console.log(`📡 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
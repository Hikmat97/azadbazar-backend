const { verifyFirebaseToken } = require('../config/firebase-verify');
const { sendMessage } = require('../controllers/chatController');
const { User } = require('../models');

const connectedUsers = new Map(); // userId -> socketId

const setupSocket = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Verify token
      const decoded = await verifyFirebaseToken(token);
      
      // Get user
      const user = await User.findOne({ where: { firebaseUid: decoded.uid } });
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.userId);
    
    // Store user connection
    connectedUsers.set(socket.userId, socket.id);
    
    // Notify user is online
    io.emit('user-online', { userId: socket.userId });

    // Join conversation room
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Send message
    socket.on('send-message', async (data) => {
      try {
        const { conversationId, receiverId, message } = data;
        
        console.log('📨 New message:', {
          from: socket.userId,
          to: receiverId,
          conversation: conversationId
        });

        // Save message to database
        const newMessage = await sendMessage(
          conversationId,
          socket.userId,
          receiverId,
          message
        );

        // Emit to conversation room
        io.to(`conversation:${conversationId}`).emit('new-message', newMessage);

        // Send notification to receiver if online
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message-notification', {
            conversationId,
            message: newMessage
          });
        }

        // Send success to sender
        socket.emit('message-sent', { success: true, message: newMessage });
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { conversationId, receiverId } = data;
      const receiverSocketId = connectedUsers.get(receiverId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user-typing', {
          conversationId,
          userId: socket.userId
        });
      }
    });

    // Stop typing
    socket.on('stop-typing', (data) => {
      const { conversationId, receiverId } = data;
      const receiverSocketId = connectedUsers.get(receiverId);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user-stop-typing', {
          conversationId,
          userId: socket.userId
        });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.userId);
      connectedUsers.delete(socket.userId);
      io.emit('user-offline', { userId: socket.userId });
    });
  });

  return io;
};

module.exports = setupSocket;
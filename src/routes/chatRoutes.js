const express = require('express');
const router = express.Router();
const {
  getOrCreateConversation,
  getConversations,
  getMessages
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.post('/conversations', protect, getOrCreateConversation);
router.get('/conversations', protect, getConversations);
router.get('/conversations/:conversationId/messages', protect, getMessages);

module.exports = router;
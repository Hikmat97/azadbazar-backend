const { Conversation, Message, User, Listing } = require('../models');
const { Op } = require('sequelize');

// Get or create conversation
const getOrCreateConversation = async (req, res) => {
  try {
    const { userId, listingId } = req.body;
    const currentUserId = req.user.id;

    if (currentUserId === userId) {
      return res.status(400).json({ error: 'Cannot chat with yourself' });
    }

    // Check if listing exists
    const listing = await Listing.findByPk(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Sort user IDs to maintain consistency
    const [user1Id, user2Id] = [currentUserId, userId].sort();

    // Find or create conversation
    let conversation = await Conversation.findOne({
      where: {
        user1Id,
        user2Id,
        listingId
      },
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'fullName', 'avatar']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'fullName', 'avatar']
        },
        {
          model: Listing,
          as: 'listing',
          attributes: ['id', 'title', 'price', 'images']
        }
      ]
    });

    if (!conversation) {
      conversation = await Conversation.create({
        user1Id,
        user2Id,
        listingId
      });

      // Fetch with includes
      conversation = await Conversation.findByPk(conversation.id, {
        include: [
          {
            model: User,
            as: 'user1',
            attributes: ['id', 'fullName', 'avatar']
          },
          {
            model: User,
            as: 'user2',
            attributes: ['id', 'fullName', 'avatar']
          },
          {
            model: Listing,
            as: 'listing',
            attributes: ['id', 'title', 'price', 'images']
          }
        ]
      });
    }

    // Get other user
    const otherUser = conversation.user1Id === currentUserId 
      ? conversation.user2 
      : conversation.user1;

    res.json({
      success: true,
      conversation: {
        ...conversation.toJSON(),
        otherUser
      }
    });
  } catch (error) {
    console.error('Get/Create conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
};

// Get user's conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'fullName', 'avatar']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'fullName', 'avatar']
        },
        {
          model: Listing,
          as: 'listing',
          attributes: ['id', 'title', 'price', 'images', 'status']
        }
      ],
      order: [['lastMessageAt', 'DESC']]
    });

    // Get unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.count({
          where: {
            conversationId: conv.id,
            receiverId: userId,
            isRead: false
          }
        });

        const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1;

        return {
          ...conv.toJSON(),
          otherUser,
          unreadCount
        };
      })
    );

    res.json({
      success: true,
      conversations: conversationsWithUnread
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
};

// Get messages in conversation
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get messages
    const { count, rows } = await Message.findAndCountAll({
      where: { conversationId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'avatar']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // Mark messages as read
    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          conversationId,
          receiverId: userId,
          isRead: false
        }
      }
    );

    res.json({
      success: true,
      messages: rows.reverse(), // Reverse to show oldest first
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

// Send message (will be used by Socket.io too)
const sendMessage = async (conversationId, senderId, receiverId, messageText) => {
  try {
    // Create message
    const message = await Message.create({
      conversationId,
      senderId,
      receiverId,
      message: messageText
    });

    // Update conversation
    await Conversation.update(
      {
        lastMessage: messageText,
        lastMessageAt: new Date()
      },
      { where: { id: conversationId } }
    );

    // Get message with sender info
    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'avatar']
        }
      ]
    });

    return messageWithSender;
  } catch (error) {
    console.error('Send message error:', error);
    throw error;
  }
};

module.exports = {
  getOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage
};
const { PushToken } = require('../models');
const { Expo } = require('expo-server-sdk');
const { NOTIFICATION_TYPES, NOTIFICATION_MESSAGES } = require('../utils/notificationTypes');

const expo = new Expo();

// Register push token (existing)
const registerPushToken = async (req, res) => {
  try {
    const { token, deviceType } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    if (!Expo.isExpoPushToken(token)) {
      return res.status(400).json({ error: 'Invalid Expo push token' });
    }

    let pushToken = await PushToken.findOne({ where: { token } });

    if (pushToken) {
      await pushToken.update({
        userId,
        deviceType: deviceType || 'android',
        isActive: true
      });
    } else {
      pushToken = await PushToken.create({
        userId,
        token,
        deviceType: deviceType || 'android',
        isActive: true
      });
    }

    res.json({
      success: true,
      message: 'Push token registered successfully'
    });
  } catch (error) {
    console.error('Register push token error:', error);
    res.status(500).json({ error: 'Failed to register push token' });
  }
};

// Universal notification sender
const sendNotification = async (userId, notificationType, data) => {
  try {
    // Get notification template
    const notificationTemplate = NOTIFICATION_MESSAGES[notificationType];
    
    if (!notificationTemplate) {
      console.error('❌ Unknown notification type:', notificationType);
      return;
    }

    const notification = notificationTemplate(data);

    // Send push notification
    await sendPushNotification(
      userId,
      notification.title,
      notification.body,
      notification.data
    );
  } catch (error) {
    console.error('❌ Send notification error:', error);
  }
};

// Send push notification (existing, but enhanced)
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    console.log(`📲 Sending notification to user ${userId}: ${title}`);

    const pushTokens = await PushToken.findAll({
      where: { userId, isActive: true }
    });

    if (pushTokens.length === 0) {
      console.log('⚠️ No push tokens found for user:', userId);
      return;
    }

    const messages = pushTokens.map(tokenObj => ({
      to: tokenObj.token,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: data.type === NOTIFICATION_TYPES.NEW_MESSAGE ? 'messages' : 'default',
      badge: 1
    }));

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        console.log('✅ Push notifications sent');
      } catch (error) {
        console.error('❌ Error sending chunk:', error);
      }
    }

    // Handle errors
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      
      if (ticket.status === 'error') {
        console.error('❌ Notification error:', ticket.message);
        
        if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
          await PushToken.update(
            { isActive: false },
            { where: { token: messages[i].to } }
          );
        }
      }
    }

    return tickets;
  } catch (error) {
    console.error('❌ Send push notification error:', error);
    throw error;
  }
};

// Delete push token (existing)
const deletePushToken = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    await PushToken.update(
      { isActive: false },
      { where: { userId, token } }
    );

    res.json({
      success: true,
      message: 'Push token deactivated'
    });
  } catch (error) {
    console.error('Delete push token error:', error);
    res.status(500).json({ error: 'Failed to delete push token' });
  }
};

module.exports = {
  registerPushToken,
  sendPushNotification,
  sendNotification,
  deletePushToken
};
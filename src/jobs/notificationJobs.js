const cron = require('node-cron');
const { Listing, User } = require('../models');
const { Op } = require('sequelize');
const { sendNotification } = require('../controllers/notificationController');
const { NOTIFICATION_TYPES } = require('../utils/notificationTypes');

// Check for expiring listings every day at 9 AM
const setupNotificationJobs = () => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('🔔 Running expiring listings check...');
    
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 30);

      // Find listings expiring in 3 days
      const expiringListings = await Listing.findAll({
        where: {
          status: 'active',
          expiresAt: {
            [Op.lte]: threeDaysFromNow,
            [Op.gt]: new Date()
          }
        },
        include: [
          { model: User, as: 'seller', attributes: ['id'] }
        ]
      });

      console.log(`Found ${expiringListings.length} expiring listings`);

      for (const listing of expiringListings) {
        const daysLeft = Math.ceil(
          (new Date(listing.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
        );

        await sendNotification(
          listing.userId,
          NOTIFICATION_TYPES.LISTING_EXPIRING,
          {
            listingTitle: listing.title,
            listingId: listing.id,
            daysLeft
          }
        );
      }

      console.log('✅ Expiring listings notifications sent');
    } catch (error) {
      console.error('❌ Error sending expiring notifications:', error);
    }
  });

  console.log('✅ Notification jobs scheduled');
};

module.exports = { setupNotificationJobs };
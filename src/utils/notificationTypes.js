const NOTIFICATION_TYPES = {
  // Chat notifications
  NEW_MESSAGE: 'new_message',
  
  // Listing notifications
  NEW_OFFER: 'new_offer',
  LISTING_SOLD: 'listing_sold',
  LISTING_FAVORITED: 'listing_favorited',
  LISTING_EXPIRING: 'listing_expiring',
  
  // Price notifications
  PRICE_DROP: 'price_drop',
  
  // General
  SYSTEM: 'system'
};

const NOTIFICATION_MESSAGES = {
  [NOTIFICATION_TYPES.NEW_MESSAGE]: (data) => ({
    title: data.senderName,
    body: data.message,
    data: {
      type: NOTIFICATION_TYPES.NEW_MESSAGE,
      conversationId: data.conversationId,
      senderId: data.senderId
    }
  }),

  [NOTIFICATION_TYPES.NEW_OFFER]: (data) => ({
    title: 'New Offer on Your Listing',
    body: `Someone is interested in "${data.listingTitle}"`,
    data: {
      type: NOTIFICATION_TYPES.NEW_OFFER,
      listingId: data.listingId,
      conversationId: data.conversationId
    }
  }),

  [NOTIFICATION_TYPES.LISTING_SOLD]: (data) => ({
    title: 'Listing Marked as Sold',
    body: `Your listing "${data.listingTitle}" has been marked as sold`,
    data: {
      type: NOTIFICATION_TYPES.LISTING_SOLD,
      listingId: data.listingId
    }
  }),

  [NOTIFICATION_TYPES.LISTING_FAVORITED]: (data) => ({
    title: 'Someone Liked Your Listing',
    body: `${data.userName} favorited "${data.listingTitle}"`,
    data: {
      type: NOTIFICATION_TYPES.LISTING_FAVORITED,
      listingId: data.listingId
    }
  }),

  [NOTIFICATION_TYPES.LISTING_EXPIRING]: (data) => ({
    title: 'Listing Expiring Soon',
    body: `Your listing "${data.listingTitle}" expires in ${data.daysLeft} days`,
    data: {
      type: NOTIFICATION_TYPES.LISTING_EXPIRING,
      listingId: data.listingId
    }
  }),

  [NOTIFICATION_TYPES.PRICE_DROP]: (data) => ({
    title: 'Price Drop Alert!',
    body: `"${data.listingTitle}" price reduced to Rs ${data.newPrice}`,
    data: {
      type: NOTIFICATION_TYPES.PRICE_DROP,
      listingId: data.listingId
    }
  })
};

module.exports = {
  NOTIFICATION_TYPES,
  NOTIFICATION_MESSAGES
};
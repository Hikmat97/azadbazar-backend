const User = require('./User');
const Category = require('./Category');
const Listing = require('./Listing');
const Favorite = require('./Favorite');
const Conversation = require('./Conversation');
const Message = require('./Message');

// User <-> Listings
User.hasMany(Listing, {
  foreignKey: 'userId',
  as: 'listings'
});

Listing.belongsTo(User, {
  foreignKey: 'userId',
  as: 'seller'
});

// Category <-> Listings
Category.hasMany(Listing, {
  foreignKey: 'categoryId',
  as: 'listings'
});

Listing.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category'
});

// User <-> Favorites <-> Listings
User.belongsToMany(Listing, {
  through: Favorite,
  as: 'favoriteListings',
  foreignKey: 'userId'
});

Listing.belongsToMany(User, {
  through: Favorite,
  as: 'favoritedBy',
  foreignKey: 'listingId'
});

// Conversations
Conversation.belongsTo(User, {
  foreignKey: 'user1Id',
  as: 'user1'
});

Conversation.belongsTo(User, {
  foreignKey: 'user2Id',
  as: 'user2'
});

Conversation.belongsTo(Listing, {
  foreignKey: 'listingId',
  as: 'listing'
});

// Messages
Message.belongsTo(Conversation, {
  foreignKey: 'conversationId',
  as: 'conversation'
});

Message.belongsTo(User, {
  foreignKey: 'senderId',
  as: 'sender'
});

Message.belongsTo(User, {
  foreignKey: 'receiverId',
  as: 'receiver'
});

Conversation.hasMany(Message, {
  foreignKey: 'conversationId',
  as: 'messages'
});

module.exports = {
  User,
  Category,
  Listing,
  Favorite,
  Conversation,
  Message
};
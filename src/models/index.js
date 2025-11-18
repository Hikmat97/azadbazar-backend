
const User = require('./User');
const Category = require('./Category');
const Listing = require('./Listing');
const Favorite = require('./Favorite');
const Conversation = require('./Conversation');
const Message = require('./Message');
const PushToken = require('./PushToken');



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

// User <-> Favorites <-> Listings (IMPORTANT!)
User.belongsToMany(Listing, {
  through: Favorite,
  as: 'favoriteListings',
  foreignKey: 'userId',
  otherKey: 'listingId'
});

Listing.belongsToMany(User, {
  through: Favorite,
  as: 'favoritedBy',
  foreignKey: 'listingId',
  otherKey: 'userId'
});

// Add direct associations for easier querying
Favorite.belongsTo(Listing, {
  foreignKey: 'listingId',
  as: 'listing'
});

Favorite.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Listing.hasMany(Favorite, {
  foreignKey: 'listingId',
  as: 'favorites'
});

User.hasMany(Favorite, {
  foreignKey: 'userId',
  as: 'favorites'
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

User.hasMany(PushToken, {
  foreignKey: 'userId',
  as: 'pushTokens'
});

PushToken.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  User,
  Category,
  Listing,
  Favorite,
  Conversation,
  Message,
  PushToken
};

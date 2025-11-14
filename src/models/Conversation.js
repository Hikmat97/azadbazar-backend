const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user1Id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  user2Id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  listingId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'listings',
      key: 'id'
    }
  },
  lastMessage: {
    type: DataTypes.TEXT
  },
  lastMessageAt: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'conversations',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user1Id', 'user2Id', 'listingId']
    }
  ]
});

module.exports = Conversation;
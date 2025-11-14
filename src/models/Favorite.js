const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Favorite = sequelize.define('Favorite', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
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
  }
}, {
  tableName: 'favorites',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'listingId']
    }
  ]
});

module.exports = Favorite;
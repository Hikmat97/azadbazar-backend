const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PushToken = sequelize.define('PushToken', {
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
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  deviceType: {
    type: DataTypes.ENUM('ios', 'android', 'web'),
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'push_tokens',
  timestamps: true
});

module.exports = PushToken;
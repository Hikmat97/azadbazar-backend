const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  icon: {
    type: DataTypes.STRING, // Icon name (ionicons)
    allowNull: false
  },
  image: {
    type: DataTypes.STRING // Category image URL
  },
  description: {
    type: DataTypes.TEXT
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'categories',
  timestamps: true
});

// Self-referencing association for subcategories
Category.hasMany(Category, {
  as: 'subcategories',
  foreignKey: 'parentId'
});

Category.belongsTo(Category, {
  as: 'parent',
  foreignKey: 'parentId'
});

module.exports = Category;
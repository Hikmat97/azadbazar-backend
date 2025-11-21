const { sequelize } = require('./database');
const { User, Category, Listing, Favorite } = require('../models');

const syncDatabase = async () => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // In production, only sync without altering existing tables
      await sequelize.sync({ alter: false });
      console.log('✅ Database synced (production mode - no alterations)');
    } else {
      // In development, allow alterations
      await sequelize.sync({ alter: true });
      console.log('✅ Database synced (development mode - with alterations)');
    }
    
    // Seed categories if empty
    await seedCategories();
    
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    throw error;
  }
};

const seedCategories = async () => {
  try {
    const count = await Category.count();
    
    if (count === 0) {
      console.log('📦 Seeding categories...');
      
      const categories = [
        { name: 'Mobiles', slug: 'mobiles', icon: 'phone-portrait', order: 1 },
        { name: 'Vehicles', slug: 'vehicles', icon: 'car', order: 2 },
        { name: 'Property', slug: 'property', icon: 'home', order: 3 },
        { name: 'Electronics', slug: 'electronics', icon: 'laptop', order: 4 },
        { name: 'Furniture', slug: 'furniture', icon: 'bed', order: 5 },
        { name: 'Fashion', slug: 'fashion', icon: 'shirt', order: 6 },
        { name: 'Books', slug: 'books', icon: 'book', order: 7 },
        { name: 'Sports', slug: 'sports', icon: 'football', order: 8 },
        { name: 'Kids', slug: 'kids', icon: 'happy', order: 9 },
        { name: 'Pets', slug: 'pets', icon: 'paw', order: 10 },
        { name: 'Services', slug: 'services', icon: 'construct', order: 11 },
        { name: 'Jobs', slug: 'jobs', icon: 'briefcase', order: 12 }
      ];
      
      await Category.bulkCreate(categories);
      console.log('✅ Categories seeded successfully');
    } else {
      console.log('ℹ️ Categories already exist, skipping seed');
    }
  } catch (error) {
    console.error('❌ Category seeding failed:', error);
  }
};

module.exports = syncDatabase;
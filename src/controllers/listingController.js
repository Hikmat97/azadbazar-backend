const { Listing, User, Category, Favorite } = require('../models');
const { Op } = require('sequelize');
const { sendNotification } = require('./notificationController');
const { NOTIFICATION_TYPES } = require('../utils/notificationTypes');

// Get all listings
const getListings = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      categoryId, 
      city,
      minPrice,
      maxPrice,
      condition,
      search,
      featured
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build where clause
    const where = { status: 'active' };
    
    if (categoryId) where.categoryId = categoryId;
    if (city) where.city = city;
    if (condition) where.condition = condition;
    if (featured) where.isFeatured = true;
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = minPrice;
      if (maxPrice) where.price[Op.lte] = maxPrice;
    }
    
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Listing.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'fullName', 'avatar', 'rating']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'icon']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      listings: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
};

// Get listing by ID
// Get listing by ID
const getListingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // Get user ID if logged in
    
    const listing = await Listing.findByPk(id, {
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'fullName', 'avatar', 'rating', 'phoneNumber']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'icon']
        }
      ]
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Increment views
    await listing.increment('views');

    // Check if user has favorited this listing
    let isFavorite = false;
    if (userId) {
      const favorite = await Favorite.findOne({
        where: { userId, listingId: id }
      });
      isFavorite = !!favorite;
    }

    res.json({
      success: true,
      listing: {
        ...listing.toJSON(),
        isFavorite
      }
    });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
};

// Create listing
const createListing = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      price,
      condition,
      images,
      location,
      city,
      state,
      latitude,
      longitude,
      categoryId
    } = req.body;

    // Validate required fields
    if (!title || !description || !price || !location || !city || !categoryId) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Set expiration (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const listing = await Listing.create({
      userId,
      title,
      description,
      price,
      condition,
      images: images || [],
      location,
      city,
      state,
      latitude,
      longitude,
      categoryId,
      expiresAt
    });

    const createdListing = await Listing.findByPk(listing.id, {
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'fullName', 'avatar']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'icon']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      listing: createdListing
    });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ error: 'Failed to create listing' });
  }
};

// Get user's listings
const getMyListings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'active' } = req.query;

    const listings = await Listing.findAll({
      where: { userId, status },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'icon']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      listings
    });
  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
};

// Toggle favorite
const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { listingId } = req.params;

    // Get listing info
    const listing = await Listing.findByPk(listingId, {
      include: [
        { model: User, as: 'seller', attributes: ['id', 'fullName'] }
      ]
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const existing = await Favorite.findOne({
      where: { userId, listingId }
    });

    if (existing) {
      // Remove from favorites
      await existing.destroy();
      res.json({
        success: true,
        message: 'Removed from favorites',
        isFavorite: false
      });
    } else {
      // Add to favorites
      await Favorite.create({ userId, listingId });

      // 🆕 Send notification to listing owner
      if (listing.userId !== userId) {
        const user = await User.findByPk(userId, {
          attributes: ['fullName']
        });

        await sendNotification(listing.userId, NOTIFICATION_TYPES.LISTING_FAVORITED, {
          userName: user.fullName,
          listingTitle: listing.title,
          listingId: listing.id
        });
      }

      res.json({
        success: true,
        message: 'Added to favorites',
        isFavorite: true
      });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to update favorite' });
  }
};

// Get user's favorites
// Get user's favorites
const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('📋 Fetching favorites for user:', userId);

    const favorites = await Favorite.findAll({
      where: { userId },
      include: [{
        model: Listing,
        as: 'listing',
        where: { status: 'active' }, // Only show active listings
        required: false, // Use LEFT JOIN to include favorites even if listing is deleted
        include: [
          {
            model: User,
            as: 'seller',
            attributes: ['id', 'fullName', 'avatar']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'slug', 'icon']
          }
        ]
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log('✅ Found favorites:', favorites.length);

    // Map to extract listings and add isFavorite flag
    const favoritedListings = favorites
      .filter(f => f.listing) // Filter out favorites where listing is null
      .map(f => ({
        ...f.listing.toJSON(),
        isFavorite: true
      }));

    res.json({
      success: true,
      favorites: favoritedListings
    });
  } catch (error) {
    console.error('❌ Get favorites error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};

// Update listing
const updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      title,
      description,
      price,
      condition,
      images,
      location,
      city,
      state,
      categoryId,
      status
    } = req.body;

    // Find listing
    const listing = await Listing.findByPk(id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Check ownership
    if (listing.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this listing' });
    }

    // Update listing
    await listing.update({
      title: title || listing.title,
      description: description || listing.description,
      price: price || listing.price,
      condition: condition || listing.condition,
      images: images || listing.images,
      location: location || listing.location,
      city: city || listing.city,
      state: state || listing.state,
      categoryId: categoryId || listing.categoryId,
      status: status || listing.status
    });

    const updatedListing = await Listing.findByPk(id, {
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'fullName', 'avatar']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'icon']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Listing updated successfully',
      listing: updatedListing
    });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ error: 'Failed to update listing' });
  }
};

// Delete listing (soft delete)
const deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await Listing.findByPk(id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Check ownership
    if (listing.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    // Soft delete (change status to deleted)
    await listing.update({ status: 'deleted' });

    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
};

// Mark listing as sold
const markAsSold = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const listing = await Listing.findByPk(id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await listing.update({ status: 'sold' });

    // 🆕 Send notification to user
    await sendNotification(userId, NOTIFICATION_TYPES.LISTING_SOLD, {
      listingTitle: listing.title,
      listingId: listing.id
    });

    res.json({
      success: true,
      message: 'Listing marked as sold'
    });
  } catch (error) {
    console.error('Mark as sold error:', error);
    res.status(500).json({ error: 'Failed to mark as sold' });
  }
};



module.exports = {
  getListings,
  getListingById,
  createListing,
  getMyListings,
  toggleFavorite,
  getFavorites,
  updateListing,
  deleteListing,
  markAsSold
};


const express = require('express');
const router = express.Router();
const {
  getListings,
  getListingById,
  createListing,
  getMyListings,
  toggleFavorite,
  getFavorites,
  updateListing,
  deleteListing,
  markAsSold
} = require('../controllers/listingController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getListings);
router.get('/:id', getListingById);

// Protected routes
router.post('/', protect, createListing);
router.put('/:id', protect, updateListing);
router.delete('/:id', protect, deleteListing);
router.patch('/:id/sold', protect, markAsSold);
router.get('/user/my-listings', protect, getMyListings);
router.post('/:listingId/favorite', protect, toggleFavorite);
router.get('/user/favorites', protect, getFavorites);

module.exports = router;
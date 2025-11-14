const express = require('express');
const router = express.Router();
const { register, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
const express = require('express');
const router = express.Router();
const { registerPushToken, deletePushToken } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.post('/register', protect, registerPushToken);
router.post('/delete', protect, deletePushToken);

module.exports = router;
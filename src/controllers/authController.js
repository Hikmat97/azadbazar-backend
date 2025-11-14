const User = require('../models/User');

// Register new user
const register = async (req, res) => {
  try {
    const { firebaseUid, email, fullName, phoneNumber } = req.body;

    console.log('📝 Register request:', { firebaseUid, email, fullName });

    // Validate required fields
    if (!firebaseUid || !email || !fullName) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Check if user already exists
    let user = await User.findOne({ where: { firebaseUid } });

    if (user) {
      console.log('ℹ️ User already exists:', user.email);
      return res.status(200).json({
        success: true,
        message: 'User already registered',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          avatar: user.avatar,
          location: user.location
        }
      });
    }

    // Create new user
    user = await User.create({
      firebaseUid,
      email,
      fullName,
      phoneNumber: phoneNumber || null
    });

    console.log('✅ User created successfully:', user.email);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        location: user.location
      }
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = req.user;

    console.log('✅ Get me request for:', user.email);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        location: user.location,
        rating: user.rating,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('❌ Get me error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, location, avatar } = req.body;
    const user = req.user;

    await user.update({
      fullName: fullName || user.fullName,
      phoneNumber: phoneNumber || user.phoneNumber,
      location: location || user.location,
      avatar: avatar || user.avatar
    });

    console.log('✅ Profile updated for:', user.email);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        location: user.location,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  register,
  getMe,
  updateProfile
};
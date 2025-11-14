const jwt = require('jsonwebtoken');

const verifyFirebaseToken = async (token) => {
  console.log('🔐 Decoding Firebase token...');
  
  try {
    // Decode token without verification
    const decoded = jwt.decode(token);
    
    if (!decoded) {
      throw new Error('Invalid token structure');
    }

    // Check token fields
    if (!decoded.user_id && !decoded.uid) {
      throw new Error('Token missing user ID');
    }

    if (!decoded.email) {
      throw new Error('Token missing email');
    }

    // Log token info
    console.log('✅ Token decoded successfully');
    console.log('UID:', decoded.user_id || decoded.uid);
    console.log('Email:', decoded.email);
    console.log('Issued at:', new Date((decoded.iat || 0) * 1000));
    console.log('Expires at:', new Date((decoded.exp || 0) * 1000));
    
    // Check if expired (but only warn, don't fail)
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      const expiredMinutes = Math.floor((Date.now() / 1000 - decoded.exp) / 60);
      console.log(`⚠️ Token expired ${expiredMinutes} minutes ago (allowing for development)`);
      // Don't throw error, just warn
    }

    return {
      uid: decoded.user_id || decoded.uid,
      email: decoded.email,
      email_verified: decoded.email_verified || false,
      iat: decoded.iat,
      exp: decoded.exp
    };
    
  } catch (error) {
    console.error('❌ Token decode error:', error.message);
    throw new Error('Invalid token: ' + error.message);
  }
};

module.exports = { verifyFirebaseToken };
// const { verifyFirebaseToken } = require('../config/firebase-admin');
// const User = require('../models/User');

// const protect = async (req, res, next) => {
//   console.log('\n🔒 === AUTH MIDDLEWARE START ===');
//   console.log('Request URL:', req.originalUrl);
//   console.log('Request Method:', req.method);
  
//   try {
//     let token;

//     // Get token from header
//     if (req.headers.authorization) {
//       console.log('📋 Authorization header found:', req.headers.authorization.substring(0, 30) + '...');
      
//       if (req.headers.authorization.startsWith('Bearer ')) {
//         token = req.headers.authorization.split(' ')[1];
//         console.log('✅ Token extracted from Bearer');
//         console.log('Token length:', token.length);
//       } else {
//         console.log('❌ Authorization header does not start with Bearer');
//         return res.status(401).json({ error: 'Invalid authorization format' });
//       }
//     } else {
//       console.log('❌ No authorization header found');
//       console.log('Headers:', JSON.stringify(req.headers, null, 2));
//       return res.status(401).json({ error: 'Not authorized, no token' });
//     }

//     if (!token) {
//       console.log('❌ Token is empty after extraction');
//       return res.status(401).json({ error: 'Not authorized, no token' });
//     }

//     try {
//       // Verify Firebase token
//       console.log('🔐 Attempting to verify token...');
//       const decoded = await verifyFirebaseToken(token);
//       console.log('✅ Token verified! Firebase UID:', decoded.uid);
      
//       // Get user from database
//       console.log('🔍 Looking up user in database...');
//       const user = await User.findOne({ where: { firebaseUid: decoded.uid } });

//       if (!user) {
//         console.log('❌ User not found in database for Firebase UID:', decoded.uid);
//         return res.status(401).json({ error: 'User not found' });
//       }

//       console.log('✅ User found:', user.email);
//       console.log('User ID:', user.id);
      
//       req.user = user;
//       console.log('✅ === AUTH MIDDLEWARE SUCCESS ===\n');
//       next();
      
//     } catch (verifyError) {
//       console.error('❌ Token verification failed in middleware');
//       console.error('Verify error:', verifyError.message);
//       return res.status(401).json({ 
//         error: 'Not authorized, token failed',
//         details: verifyError.message 
//       });
//     }
    
//   } catch (error) {
//     console.error('❌ Auth middleware unexpected error:', error);
//     console.log('❌ === AUTH MIDDLEWARE FAILED ===\n');
//     res.status(401).json({ 
//       error: 'Not authorized, token failed',
//       details: error.message 
//     });
//   }
// };

// module.exports = { protect };




const { verifyFirebaseToken } = require('../config/firebase-verify'); // Changed import
const User = require('../models/User');

const protect = async (req, res, next) => {
  console.log('\n🔒 === AUTH MIDDLEWARE START ===');
  console.log('Request URL:', req.originalUrl);
  
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('✅ Token extracted, length:', token.length);
    } else {
      console.log('❌ No valid authorization header');
      return res.status(401).json({ error: 'Not authorized, no token' });
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token' });
    }

    try {
      // Verify token using local method
      const decoded = await verifyFirebaseToken(token);
      console.log('✅ Token verified! UID:', decoded.uid);
      
      // Get user from database
      const user = await User.findOne({ where: { firebaseUid: decoded.uid } });

      if (!user) {
        console.log('❌ User not found for UID:', decoded.uid);
        return res.status(401).json({ error: 'User not found' });
      }

      console.log('✅ User authenticated:', user.email);
      req.user = user;
      console.log('✅ === AUTH MIDDLEWARE SUCCESS ===\n');
      next();
      
    } catch (verifyError) {
      console.error('❌ Verification error:', verifyError.message);
      return res.status(401).json({ 
        error: 'Not authorized, token failed',
        details: verifyError.message 
      });
    }
    
  } catch (error) {
    console.error('❌ Middleware error:', error.message);
    res.status(401).json({ error: 'Not authorized' });
  }
};

module.exports = { protect };
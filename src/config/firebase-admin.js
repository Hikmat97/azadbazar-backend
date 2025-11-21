const admin = require('firebase-admin');
const path = require('path');

let firebaseApp;

try {
  if (admin.apps.length === 0) {
    let serviceAccount;
    
    // In production, read from environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('📄 Loading Firebase config from environment variable');
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      // In development, read from file
      console.log('📄 Loading Firebase config from file');
      const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
      serviceAccount = require(serviceAccountPath);
    }
    
    console.log('📧 Service account email:', serviceAccount.client_email);
    console.log('🆔 Project ID:', serviceAccount.project_id);
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    console.log('✅ Firebase Admin initialized successfully');
  } else {
    firebaseApp = admin.app();
    console.log('ℹ️ Using existing Firebase Admin instance');
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:');
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  
  // In production, this is critical - exit process
  if (process.env.NODE_ENV === 'production') {
    console.error('🚨 Cannot start server without Firebase - exiting');
    process.exit(1);
  }
}

const verifyFirebaseToken = async (token) => {
  try {
    console.log('🔐 Verifying Firebase token...');
    
    const decodedToken = await admin.auth().verifyIdToken(token, true);
    
    console.log('✅ Token verified successfully!');
    console.log('User ID:', decodedToken.uid);
    console.log('Email:', decodedToken.email);
    
    return decodedToken;
  } catch (error) {
    console.error('❌ Token verification failed!');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'auth/id-token-expired') {
      throw new Error('Token expired');
    } else if (error.code === 'auth/argument-error') {
      throw new Error('Invalid token format');
    } else {
      throw new Error('Token verification failed: ' + error.message);
    }
  }
};

module.exports = { admin, verifyFirebaseToken };
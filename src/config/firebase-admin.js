const admin = require('firebase-admin');
const path = require('path');

let firebaseApp;

try {
  // Check if already initialized
  if (admin.apps.length === 0) {
    const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
    const serviceAccount = require(serviceAccountPath);
    
    console.log('📄 Service account loaded');
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
  process.exit(1); // Stop server if Firebase fails
}

const verifyFirebaseToken = async (token) => {
  try {
    console.log('🔐 Verifying Firebase token...');
    console.log('Token length:', token.length);
    console.log('Token starts with:', token.substring(0, 30) + '...');
    
    const decodedToken = await admin.auth().verifyIdToken(token, true);
    
    console.log('✅ Token verified successfully!');
    console.log('User ID:', decodedToken.uid);
    console.log('Email:', decodedToken.email);
    console.log('Token issued at:', new Date(decodedToken.iat * 1000));
    console.log('Token expires at:', new Date(decodedToken.exp * 1000));
    
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
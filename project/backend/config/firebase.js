const admin = require('firebase-admin');

let firestore;

const initializeFirebase = () => {
  try {
    // Initialize Firebase Admin SDK
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });

    firestore = admin.firestore();
    console.log('🔥 FIREBASE CONNECTION ESTABLISHED SUCCESSFULLY!');
    console.log(`📁 Firestore database: ${process.env.FIREBASE_PROJECT_ID}`);
    console.log(`🔐 Service account: ${process.env.FIREBASE_CLIENT_EMAIL}`);
    console.log('✅ Firebase Admin SDK ready for use');
    
    return firestore;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    process.exit(1);
  }
};

const getFirestore = () => {
  if (!firestore) {
    throw new Error('Firestore not initialized. Call initializeFirebase() first.');
  }
  return firestore;
};

const getAuth = () => {
  return admin.auth();
};

const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  FieldValue,
  Timestamp,
  admin
};
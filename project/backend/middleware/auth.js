const { getAuth, getFirestore } = require('../config/firebase');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const idToken = authHeader.split(' ')[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);
    
    // Fetch user document from Firestore
    const firestore = getFirestore();
    const userDoc = await firestore.collection('users').doc(decodedToken.uid).get();
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      ...(userDoc.exists ? userDoc.data() : {})
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const idToken = authHeader.split(' ')[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);
    
    const firestore = getFirestore();
    const userDoc = await firestore.collection('users').doc(decodedToken.uid).get();
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      ...(userDoc.exists ? userDoc.data() : {})
    };

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth
};
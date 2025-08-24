const express = require('express');
const { getAuth, getFirestore, FieldValue } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const emailService = require('../services/emailService');

const router = express.Router();

// POST /api/auth/register
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const firestore = getFirestore();

    // Create user with Firebase Auth
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName: name
    });

    // Determine role (admin if specific email, otherwise user)
    const role = email === 'projectify198@gmail.com' ? 'admin' : 'user';

    // Create user document in Firestore
    const userData = {
      id: userRecord.uid,
      name,
      email,
      role,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    await firestore.collection('users').doc(userRecord.uid).set(userData);

    // Generate custom token for immediate login
    const customToken = await getAuth().createCustomToken(userRecord.uid);

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(email, name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: userRecord.uid,
        name,
        email,
        role
      },
      token: customToken
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    let message = 'Registration failed';
    if (error.code === 'auth/email-already-exists') {
      message = 'Email already registered';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address';
    } else if (error.code === 'auth/weak-password') {
      message = 'Password is too weak';
    }

    res.status(400).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// POST /api/auth/login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Note: In a typical Firebase setup, the client handles login and sends ID token
    // This endpoint is mainly for validation and user data retrieval
    // For demo purposes, we'll create a custom token
    
    const firestore = getFirestore();
    
    // Find user by email
    const usersSnapshot = await firestore.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Generate custom token
    const customToken = await getAuth().createCustomToken(userData.id);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      },
      token: customToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In Firebase, logout is typically handled client-side
    // Server-side logout would involve token revocation
    await getAuth().revokeRefreshTokens(req.user.uid);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.uid,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information',
      error: error.message
    });
  }
});

module.exports = router;
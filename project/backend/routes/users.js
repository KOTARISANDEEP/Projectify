const express = require('express');
const { getFirestore, FieldValue } = require('../config/firebase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - Get all users with role "user" (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const firestore = getFirestore();
    
    // Query users collection for users with role "user"
    const usersSnapshot = await firestore.collection('users')
      .where('role', '==', 'user')
      .orderBy('createdAt', 'desc')
      .get();

    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unknown',
        email: data.email || '',
        role: data.role || 'user',
        status: data.status || 'active',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        lastLogin: data.lastLogin?.toDate?.()?.toISOString() || data.lastLogin || null
      };
    });

    res.json({
      success: true,
      users,
      total: users.length
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// GET /api/users/:id - Get specific user details (admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const firestore = getFirestore();
    
    const userDoc = await firestore.collection('users').doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();
    const user = {
      id: userDoc.id,
      name: userData.name || 'Unknown',
      email: userData.email || '',
      role: userData.role || 'user',
      status: userData.status || 'active',
      createdAt: userData.createdAt?.toDate?.()?.toISOString() || userData.createdAt || new Date().toISOString(),
      lastLogin: userData.lastLogin?.toDate?.()?.toISOString() || userData.lastLogin || null
    };

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// PUT /api/users/:id/status - Update user status (admin only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'inactive', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or pending'
      });
    }

    const firestore = getFirestore();
    const userRef = firestore.collection('users').doc(id);
    
    await userRef.update({
      status,
      updatedAt: FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'User status updated successfully'
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const firestore = getFirestore();
    
    // Check if user exists
    const userDoc = await firestore.collection('users').doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user document
    await firestore.collection('users').doc(id).delete();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// GET /api/users/notify/job - Get all users for job notifications (admin only)
router.get('/notify/job', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const firestore = getFirestore();
    
    // Query users collection for users with role "user" and active status
    const usersSnapshot = await firestore.collection('users')
      .where('role', '==', 'user')
      .where('status', '==', 'active')
      .get();

    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unknown',
        email: data.email || '',
        role: data.role || 'user',
        status: data.status || 'active'
      };
    }).filter(user => user.email); // Only include users with valid emails

    console.log(`Found ${users.length} active users for job notifications`);

    res.json({
      success: true,
      users,
      total: users.length
    });

  } catch (error) {
    console.error('Get users for job notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users for job notifications',
      error: error.message
    });
  }
});

module.exports = router;

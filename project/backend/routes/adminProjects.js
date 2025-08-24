const express = require('express');
const { getFirestore, FieldValue } = require('../config/firebase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateProject } = require('../middleware/validation');
const emailService = require('../services/emailService');

const router = express.Router();

// GET /api/admin-projects/test-email - Test email functionality (admin only)
router.get('/test-email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🧪 Testing email functionality...');
    
    // Test with a sample project
    const testProject = {
      title: 'Test Project',
      role: 'Test Role',
      description: 'This is a test project for email verification',
      timeline: '1 week',
      deadlineToApply: '2025-12-31'
    };

         // Fetch all users with role "user"
     const firestore = getFirestore();
     const usersSnapshot = await firestore.collection('users')
       .where('role', '==', 'user')
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
    }).filter(user => user.email);

    console.log(`🧪 Found ${users.length} active users for test email`);

    if (users.length > 0) {
      // Send test email to first user only
      const testUser = users[0];
      try {
        await emailService.sendNewJobNotificationEmail(testUser.email, testUser.name, testProject);
        console.log(`✅ Test email sent successfully to ${testUser.email}`);
        
        res.json({
          success: true,
          message: 'Test email sent successfully',
          sentTo: testUser.email,
          totalUsers: users.length
        });
      } catch (emailError) {
        console.error('❌ Test email failed:', emailError);
        res.status(500).json({
          success: false,
          message: 'Test email failed',
          error: emailError.message
        });
      }
    } else {
      res.json({
        success: false,
        message: 'No active users found for testing',
        totalUsers: 0
      });
    }

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Test email failed',
      error: error.message
    });
  }
});

// POST /api/admin-projects - Create new admin project (admin only)
router.post('/', authenticateToken, requireAdmin, validateProject, async (req, res) => {
  try {
    const { title, role, description, timeline, deadlineToApply, projectDetails } = req.body;
    const firestore = getFirestore();

    const projectData = {
      title,
      role,
      description,
      timeline,
      deadlineToApply,
      projectDetails,
      status: 'active', // Immediately visible to users
      createdBy: req.user.email || 'Admin',
      createdByEmail: req.user.email || 'admin@example.com',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const docRef = await firestore.collection('adminProjects').add(projectData);
    
    // Get the created document
    const createdDoc = await docRef.get();
    const createdProject = {
      id: createdDoc.id,
      ...createdDoc.data(),
      createdAt: createdDoc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: createdDoc.data().updatedAt?.toDate?.()?.toISOString()
    };

         // Send email notifications to all users
     try {
       console.log('📧 Starting to send job notifications for new project:', createdProject.title);
       console.log('📧 Environment check - EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
       console.log('📧 Environment check - EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
      
      // Fetch all users with role "user" (don't require status field)
      const usersSnapshot = await firestore.collection('users')
        .where('role', '==', 'user')
        .get();

      console.log('📧 Raw users query result:', usersSnapshot.docs.length, 'users found');

      const users = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📧 User data:', { id: doc.id, ...data });
        return {
          id: doc.id,
          name: data.name || 'Unknown',
          email: data.email || '',
          role: data.role || 'user',
          status: data.status || 'active'
        };
      }).filter(user => user.email); // Only include users with valid emails

      console.log('📧 Processed users:', users);

      console.log(`📧 Found ${users.length} active users to notify about new project`);

      if (users.length > 0) {
        console.log('📧 Attempting to send notifications to users:', users);
        
                 // Send bulk email notifications
         try {
           console.log('📧 About to call emailService.sendBulkJobNotifications...');
           const notificationResult = await emailService.sendBulkJobNotifications(users, createdProject);
           
           console.log('📧 Job notification results:', notificationResult);
          
          // Add notification info to response
          createdProject.notifications = {
            totalUsers: users.length,
            emailsSent: notificationResult.successful,
            emailsFailed: notificationResult.failed
          };
        } catch (emailError) {
          console.error('📧 Email service error:', emailError);
          createdProject.notifications = {
            totalUsers: users.length,
            emailsSent: 0,
            emailsFailed: users.length,
            error: emailError.message
          };
        }
      } else {
        console.log('📧 No users found to notify');
        createdProject.notifications = {
          totalUsers: 0,
          emailsSent: 0,
          emailsFailed: 0
        };
      }

    } catch (emailError) {
      console.error('❌ Error sending job notifications:', emailError);
      // Don't fail the project creation if email fails
      createdProject.notifications = {
        error: 'Failed to send email notifications',
        details: emailError.message
      };
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully and notifications sent',
      project: createdProject
    });

  } catch (error) {
    console.error('Create admin project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin project',
      error: error.message
    });
  }
});

module.exports = router;

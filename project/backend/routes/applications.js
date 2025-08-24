const express = require('express');
const { getFirestore, FieldValue } = require('../config/firebase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateApplication, validateApplicationId } = require('../middleware/validation');
const emailService = require('../services/emailService');

const router = express.Router();

// POST /api/applications
router.post('/', authenticateToken, validateApplication, async (req, res) => {
  try {
    const { projectId, username, contact, skillsDescription, experience, deadline } = req.body;
    const firestore = getFirestore();

    // Check if project exists and is approved
    const projectDoc = await firestore.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = projectDoc.data();
    if (project.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot apply to non-approved projects'
      });
    }

    // Check if user already applied to this project
    const existingApplicationSnapshot = await firestore.collection('applications')
      .where('projectId', '==', projectId)
      .where('userId', '==', req.user.uid)
      .get();

    if (!existingApplicationSnapshot.empty) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this project'
      });
    }

    // Create application
    const applicationData = {
      projectId,
      userId: req.user.uid,
      userName: req.user.name,
      userEmail: req.user.email,
      projectName: project.name,
      username: username || req.user.name,
      contact: contact || req.user.email,
      skillsDescription: skillsDescription || '',
      experience: experience || '',
      deadline: deadline || '',
      status: 'pending',
      appliedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const docRef = await firestore.collection('applications').add(applicationData);
    
    // Get the created document
    const createdDoc = await docRef.get();
    const createdApplication = {
      id: createdDoc.id,
      ...createdDoc.data(),
      appliedAt: createdDoc.data().appliedAt?.toDate?.()?.toISOString(),
      createdAt: createdDoc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: createdDoc.data().updatedAt?.toDate?.()?.toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: createdApplication
    });

  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
});

// GET /api/applications/my
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const firestore = getFirestore();

    const snapshot = await firestore.collection('applications')
      .where('userId', '==', req.user.uid)
      .orderBy('appliedAt', 'desc')
      .get();

    const applications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      appliedAt: doc.data().appliedAt?.toDate?.()?.toISOString(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString()
    }));

    res.json({
      success: true,
      applications
    });

  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
});

// GET /api/applications
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const firestore = getFirestore();
    const { projectId } = req.query;

    let query = firestore.collection('applications');
    
    if (projectId) {
      query = query.where('projectId', '==', projectId);
    }

    const snapshot = await query.orderBy('appliedAt', 'desc').get();

    const applications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      appliedAt: doc.data().appliedAt?.toDate?.()?.toISOString(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString()
    }));

    res.json({
      success: true,
      applications
    });

  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
});

// PUT /api/applications/:id/approve
router.put('/:id/approve', authenticateToken, requireAdmin, validateApplicationId, async (req, res) => {
  try {
    const { id } = req.params;
    const firestore = getFirestore();

    // Get application document
    const applicationDoc = await firestore.collection('applications').doc(id).get();
    if (!applicationDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update application status
    await firestore.collection('applications').doc(id).update({
      status: 'approved',
      updatedAt: FieldValue.serverTimestamp()
    });

    // Get updated application
    const updatedDoc = await firestore.collection('applications').doc(id).get();
    const application = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      updatedAt: updatedDoc.data().updatedAt?.toDate?.()?.toISOString()
    };

    // Send approval email
    try {
      await emailService.sendApplicationApprovedEmail(
        application.userEmail,
        application.userName,
        application.projectName
      );
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
    }

    res.json({
      success: true,
      message: 'Application approved successfully',
      application
    });

  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve application',
      error: error.message
    });
  }
});

// PUT /api/applications/:id/status
router.put('/:id/status', authenticateToken, requireAdmin, validateApplicationId, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const firestore = getFirestore();

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected'
      });
    }

    // Get application document
    const applicationDoc = await firestore.collection('applications').doc(id).get();
    if (!applicationDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update application status
    await firestore.collection('applications').doc(id).update({
      status,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Get updated application
    const updatedDoc = await firestore.collection('applications').doc(id).get();
    const application = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      updatedAt: updatedDoc.data().updatedAt?.toDate?.()?.toISOString()
    };

    // Send email based on status
    try {
      if (status === 'approved') {
        await emailService.sendApplicationApprovedEmail(
          application.userEmail,
          application.userName,
          application.projectName
        );
      } else if (status === 'rejected') {
        await emailService.sendApplicationRejectedEmail(
          application.userEmail,
          application.userName,
          application.projectName
        );
      }
    } catch (emailError) {
      console.error('Failed to send status email:', emailError);
    }

    res.json({
      success: true,
      message: `Application ${status} successfully`,
      application
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message
    });
  }
});

// PUT /api/applications/:id/reject
router.put('/:id/reject', authenticateToken, requireAdmin, validateApplicationId, async (req, res) => {
  try {
    const { id } = req.params;
    const firestore = getFirestore();

    // Get application document
    const applicationDoc = await firestore.collection('applications').doc(id).get();
    if (!applicationDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update application status
    await firestore.collection('applications').doc(id).update({
      status: 'rejected',
      updatedAt: FieldValue.serverTimestamp()
    });

    // Get updated application
    const updatedDoc = await firestore.collection('applications').doc(id).get();
    const application = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      updatedAt: updatedDoc.data().updatedAt?.toDate?.()?.toISOString()
    };

    // Send rejection email
    try {
      await emailService.sendApplicationRejectedEmail(
        application.userEmail,
        application.userName,
        application.projectName
      );
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }

    res.json({
      success: true,
      message: 'Application rejected successfully',
      application
    });

  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject application',
      error: error.message
    });
  }
});

module.exports = router;
const express = require('express');
const { getFirestore, FieldValue } = require('../config/firebase');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { validateProject, validateProjectId } = require('../middleware/validation');
const emailService = require('../services/emailService');

const router = express.Router();

// GET /api/projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const firestore = getFirestore();
    const { status } = req.query;
    
    let query = firestore.collection('projects');
    
    // For regular users, only show approved projects unless they're admin
    if (req.user.role !== 'admin' || status === 'approved') {
      query = query.where('status', '==', 'approved');
    } else if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
    }));

    res.json({
      success: true,
      projects
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
});

// POST /api/projects
router.post('/', authenticateToken, requireAdmin, validateProject, async (req, res) => {
  try {
    const { name, description, startDate, endDate, budget, role, timeline, deadlineToApply, projectDetails } = req.body;
    const firestore = getFirestore();

    const projectData = {
      name,
      description,
      startDate,
      endDate,
      budget: budget ? parseFloat(budget) : undefined,
      role,
      timeline,
      deadlineToApply,
      projectDetails,
      status: 'pending',
      createdBy: req.user.email,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const docRef = await firestore.collection('projects').add(projectData);
    
    // Get the created document
    const createdDoc = await docRef.get();
    const createdProject = {
      id: createdDoc.id,
      ...createdDoc.data(),
      createdAt: createdDoc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: createdDoc.data().updatedAt?.toDate?.()?.toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: createdProject
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    });
  }
});

// PUT /api/projects/:id/approve
router.put('/:id/approve', authenticateToken, requireAdmin, validateProjectId, async (req, res) => {
  try {
    const { id } = req.params;
    const firestore = getFirestore();

    // Update project status
    await firestore.collection('projects').doc(id).update({
      status: 'approved',
      updatedAt: FieldValue.serverTimestamp()
    });

    // Get updated project
    const projectDoc = await firestore.collection('projects').doc(id).get();
    if (!projectDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = {
      id: projectDoc.id,
      ...projectDoc.data(),
      updatedAt: projectDoc.data().updatedAt?.toDate?.()?.toISOString()
    };

    // Notify all users who applied to this project
    try {
      const applicationsSnapshot = await firestore.collection('applications')
        .where('projectId', '==', id)
        .get();

      const emailPromises = applicationsSnapshot.docs.map(async (appDoc) => {
        const application = appDoc.data();
        try {
          await emailService.sendProjectApprovalEmail(
            application.userEmail,
            application.userName,
            project.name,
            project.description
          );
        } catch (emailError) {
          console.error(`Failed to send approval email to ${application.userEmail}:`, emailError);
        }
      });

      await Promise.allSettled(emailPromises);
    } catch (emailError) {
      console.error('Error sending approval emails:', emailError);
    }

    res.json({
      success: true,
      message: 'Project approved successfully',
      project
    });

  } catch (error) {
    console.error('Approve project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve project',
      error: error.message
    });
  }
});

// PUT /api/projects/:id/reject
router.put('/:id/reject', authenticateToken, requireAdmin, validateProjectId, async (req, res) => {
  try {
    const { id } = req.params;
    const firestore = getFirestore();

    // Update project status
    await firestore.collection('projects').doc(id).update({
      status: 'rejected',
      updatedAt: FieldValue.serverTimestamp()
    });

    // Get updated project
    const projectDoc = await firestore.collection('projects').doc(id).get();
    if (!projectDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = {
      id: projectDoc.id,
      ...projectDoc.data(),
      updatedAt: projectDoc.data().updatedAt?.toDate?.()?.toISOString()
    };

    res.json({
      success: true,
      message: 'Project rejected successfully',
      project
    });

  } catch (error) {
    console.error('Reject project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject project',
      error: error.message
    });
  }
});

// GET /api/projects/:id
router.get('/:id', optionalAuth, validateProjectId, async (req, res) => {
  try {
    const { id } = req.params;
    const firestore = getFirestore();

    const projectDoc = await firestore.collection('projects').doc(id).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = {
      id: projectDoc.id,
      ...projectDoc.data(),
      createdAt: projectDoc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: projectDoc.data().updatedAt?.toDate?.()?.toISOString()
    };

    // If user is not admin and project is not approved, don't show it
    if (project.status !== 'approved' && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      project
    });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: error.message
    });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authenticateToken, requireAdmin, validateProjectId, async (req, res) => {
  try {
    const { id } = req.params;
    const firestore = getFirestore();

    // Check if project exists
    const projectDoc = await firestore.collection('projects').doc(id).get();
    if (!projectDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Delete associated applications
    const applicationsSnapshot = await firestore.collection('applications')
      .where('projectId', '==', id)
      .get();

    const batch = firestore.batch();
    applicationsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete the project
    batch.delete(firestore.collection('projects').doc(id));
    
    await batch.commit();

    res.json({
      success: true,
      message: 'Project and associated applications deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message
    });
  }
});

module.exports = router;
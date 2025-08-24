const express = require('express');
const { getFirestore } = require('../config/firebase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/dashboard
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const firestore = getFirestore();

    // Get project counts
    const projectsSnapshot = await firestore.collection('projects').get();
    const projects = projectsSnapshot.docs.map(doc => doc.data());
    
    const totalProjects = projects.length;
    const approvedProjects = projects.filter(p => p.status === 'approved').length;
    const pendingProjects = projects.filter(p => p.status === 'pending').length;
    const rejectedProjects = projects.filter(p => p.status === 'rejected').length;

    // Get application counts
    const applicationsSnapshot = await firestore.collection('applications').get();
    const applications = applicationsSnapshot.docs.map(doc => doc.data());
    
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(a => a.status === 'pending').length;
    const approvedApplications = applications.filter(a => a.status === 'approved').length;
    const rejectedApplications = applications.filter(a => a.status === 'rejected').length;

    // Generate monthly stats (mock data for demo)
    const monthlyStats = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    for (let i = 0; i < months.length; i++) {
      monthlyStats.push({
        month: months[i],
        projects: Math.floor(Math.random() * 10) + i * 2,
        applications: Math.floor(Math.random() * 20) + i * 3,
        approvals: Math.floor(Math.random() * 8) + i
      });
    }

    const dashboardData = {
      totalProjects,
      approvedProjects,
      pendingProjects,
      rejectedProjects,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      monthlyStats
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error.message
    });
  }
});

// GET /api/analytics/projects-by-status
router.get('/projects-by-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const firestore = getFirestore();

    const projectsSnapshot = await firestore.collection('projects').get();
    const projects = projectsSnapshot.docs.map(doc => doc.data());

    // Count projects by status
    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0
    };

    projects.forEach(project => {
      if (statusCounts.hasOwnProperty(project.status)) {
        statusCounts[project.status]++;
      }
    });

    const data = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Get projects by status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects by status',
      error: error.message
    });
  }
});

// GET /api/analytics/applications-by-status
router.get('/applications-by-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const firestore = getFirestore();

    const applicationsSnapshot = await firestore.collection('applications').get();
    const applications = applicationsSnapshot.docs.map(doc => doc.data());

    // Count applications by status
    const statusCounts = {
      pending: 0,
      approved: 0,
      rejected: 0
    };

    applications.forEach(application => {
      if (statusCounts.hasOwnProperty(application.status)) {
        statusCounts[application.status]++;
      }
    });

    const data = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Get applications by status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications by status',
      error: error.message
    });
  }
});

// GET /api/analytics/user-activity
router.get('/user-activity', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const firestore = getFirestore();

    // Get total users
    const usersSnapshot = await firestore.collection('users').get();
    const totalUsers = usersSnapshot.size;

    // Get users by role
    const users = usersSnapshot.docs.map(doc => doc.data());
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const regularUsers = users.filter(u => u.role === 'user').length;

    // Get recent activity (applications in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentApplicationsSnapshot = await firestore.collection('applications')
      .where('appliedAt', '>=', thirtyDaysAgo)
      .get();

    const recentActivity = recentApplicationsSnapshot.size;

    const data = {
      totalUsers,
      adminUsers,
      regularUsers,
      recentActivity
    };

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activity',
      error: error.message
    });
  }
});

module.exports = router;
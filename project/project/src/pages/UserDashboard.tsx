import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, onSnapshot, addDoc, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, Clock, CheckCircle, XCircle, TrendingUp, Home, Briefcase, Send, Bell, User, LogOut } from 'lucide-react';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import ProfileSettings from './ProfileSettings';

interface Project {
  id: string;
  title: string;
  role: string;
  description: string;
  timeline: string;
  deadlineToApply: string;
  projectDetails: string; // Hidden from users until approved
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByEmail: string;
}

interface Application {
  id: string;
  projectId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  projectTitle?: string;
  userEmail?: string;
  userName?: string;
}

const UserDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [applicationForm, setApplicationForm] = useState({
    username: '',
    contact: '',
    skillsDescription: '',
    experience: '',
    deadline: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const COLORS = ['#f97316', '#10b981', '#ef4444', '#6b7280'];

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/user/dashboard' },
    { id: 'available-projects', label: 'Available Projects', icon: Briefcase, path: '/user/available-projects' },
    { id: 'my-applications', label: 'My Applications', icon: Send, path: '/user/my-applications' },
    { id: 'approved-projects', label: 'Approved Projects', icon: CheckCircle, path: '/user/approved-projects' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/user/notifications' },
    { id: 'profile', label: 'Profile', icon: User, path: '/user/profile' },
    { id: 'logout', label: 'Logout', icon: LogOut, path: '/logout' },
  ];

  useEffect(() => {
    if (!userProfile) return;

    setLoading(true);

    // Fetch only active projects (visible to users)
    const projectsQuery = query(
      collection(db, 'adminProjects'),
      where('status', '==', 'active')
    );

    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));
      setProjects(projectsData);
    });

    // Fetch user applications
    const applicationsQuery = query(
      collection(db, 'userApplications'),
      where('userId', '==', userProfile.id)
    );

    const unsubscribeApplications = onSnapshot(applicationsQuery, (snapshot) => {
      const applicationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Application));
      setApplications(applicationsData);
      setLoading(false);
    });

    return () => {
      unsubscribeProjects();
      unsubscribeApplications();
    };
  }, [userProfile]);

  const handleNavigation = async (itemId: string, path: string) => {
    if (itemId === 'logout') {
      await logout();
      navigate('/login');
    } else {
      setActiveSection(itemId);
      // You can also use navigate(path) if you want actual route changes
      // navigate(path);
    }
  };

  const handleApplyToProject = (project: Project) => {
    setSelectedProject(project);
    setApplicationForm({
      username: userProfile?.name || '',
      contact: userProfile?.email || '',
      skillsDescription: '',
      experience: '',
      deadline: ''
    });
    setShowApplicationModal(true);
  };

  const handleSubmitApplication = async () => {
    if (!selectedProject || !userProfile) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'userApplications'), {
        username: applicationForm.username,
        contact: applicationForm.contact,
        skillsDescription: applicationForm.skillsDescription,
        experience: applicationForm.experience,
        deadline: applicationForm.deadline,
        projectId: selectedProject.id,
        userId: userProfile.id,
        userEmail: userProfile.email,
        userName: userProfile.name,
        projectTitle: selectedProject.title,
        status: 'pending',
        appliedAt: new Date().toISOString()
      });
      
      setApplySuccess(`Successfully applied to ${selectedProject.title}!`);
      setShowApplicationModal(false);
      setSelectedProject(null);
      setApplicationForm({
        username: '',
        contact: '',
        skillsDescription: '',
        experience: '',
        deadline: ''
      });
      setTimeout(() => setApplySuccess(null), 3000);
    } catch (error) {
      console.error('Error applying to project:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getApplicationStats = () => {
    const pending = applications.filter(app => app.status === 'pending').length;
    const approved = applications.filter(app => app.status === 'approved').length;
    const rejected = applications.filter(app => app.status === 'rejected').length;
    
    return { pending, approved, rejected, total: applications.length };
  };

  const getPieChartData = () => {
    const stats = getApplicationStats();
    return [
      { name: 'Pending', value: stats.pending, color: COLORS[0] },
      { name: 'Approved', value: stats.approved, color: COLORS[1] },
      { name: 'Rejected', value: stats.rejected, color: COLORS[2] }
    ].filter(item => item.value > 0);
  };

  const getTimelineData = () => {
    const now = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const monthApplications = applications.filter(app => {
        const appDate = new Date(app.appliedAt);
        return appDate.getMonth() === date.getMonth() && appDate.getFullYear() === date.getFullYear();
      }).length;
      
      months.push({
        month: monthName,
        applications: monthApplications
      });
    }
    
    return months;
  };

  const stats = getApplicationStats();
  const appliedProjectIds = new Set(applications.map(app => app.projectId));

  // Custom Sidebar Component
  const Sidebar = () => (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-bold text-white">Dashboard</h2>
      </div>
      
      <nav className="flex-1 px-4">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavigation(item.id, item.path)}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center px-4 py-3 mb-2 rounded-lg transition-all duration-200 ${
                activeSection === item.id
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Icon size={20} className="mr-3" />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>
    </div>
  );

  // StatCard Component
  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
            <TrendingUp size={16} className="mr-1" />
            {trend.value}%
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
      <p className="text-gray-400 text-sm">{title}</p>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 bg-gray-900 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <>
            {/* Success Message */}
            {applySuccess && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-500 text-white rounded-lg"
              >
                {applySuccess}
              </motion.div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Applications"
                value={stats.total}
                icon={FileText}
                color="bg-orange-500"
                trend={{ value: 12, isPositive: true }}
              />
              <StatCard
                title="Pending"
                value={stats.pending}
                icon={Clock}
                color="bg-yellow-500"
              />
              <StatCard
                title="Approved"
                value={stats.approved}
                icon={CheckCircle}
                color="bg-green-500"
              />
              <StatCard
                title="Rejected"
                value={stats.rejected}
                icon={XCircle}
                color="bg-red-500"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Application Status Pie Chart */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700"
              >
                <h3 className="text-xl font-semibold text-white mb-4">Application Status</h3>
                {getPieChartData().length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getPieChartData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="value"
                        >
                          {getPieChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center mt-4 space-x-4">
                      {getPieChartData().map((entry, index) => (
                        <div key={index} className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm text-gray-400">
                            {entry.name}: {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-300 text-gray-400">
                    No application data to display
                  </div>
                )}
              </motion.div>

              {/* Applications Over Time */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700"
              >
                <div className="flex items-center mb-4">
                  <TrendingUp size={24} className="text-orange-500 mr-3" />
                  <h3 className="text-xl font-semibold text-white">Applications Over Time</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getTimelineData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="applications" 
                      stroke="#f97316" 
                      strokeWidth={3}
                      dot={{ fill: '#f97316', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* New Projects Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Latest Projects</h3>
              <p className="text-gray-400 text-sm mb-6">New project opportunities for you</p>
              
              {projects.filter(project => !applications.some(app => app.projectId === project.id && app.userId === userProfile?.id)).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.filter(project => !applications.some(app => app.projectId === project.id && app.userId === userProfile?.id)).slice(0, 3).map((project) => (
                    <div key={project.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-white">{project.title}</h4>
                        <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs">
                          {project.role}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{project.description}</p>
                      

                      
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400">
                          Timeline: {project.timeline}
                        </span>
                        <span className="text-xs text-gray-400">
                          Deadline: {project.deadlineToApply}
                        </span>
                      </div>
                      {!appliedProjectIds.has(project.id) ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleApplyToProject(project)}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm transition-colors"
                        >
                          Apply Now
                        </motion.button>
                      ) : (
                        <div className="w-full text-center text-green-400 text-sm py-2">
                          Applied ✓
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Briefcase size={48} className="mx-auto mb-4" />
                  <p>No new projects available to apply for.</p>
                </div>
              )}
            </motion.div>
          </>
        );

      case 'available-projects':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Available Projects</h3>
            <p className="text-gray-400 text-sm mb-6">Browse and apply to open projects</p>
            
            {projects.filter(project => !applications.some(app => app.projectId === project.id && app.userId === userProfile?.id)).length > 0 ? (
              <div className="space-y-6">
                {projects.filter(project => !applications.some(app => app.projectId === project.id && app.userId === userProfile?.id)).map((project) => (
                  <div key={project.id} className="bg-gray-700 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-xl font-semibold text-white">{project.title}</h4>
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                        {project.role}
                      </span>
                    </div>
                    <p className="text-gray-400 mb-4">{project.description}</p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-gray-500">Role:</span>
                        <p className="text-white">{project.role}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Timeline:</span>
                        <p className="text-white">{project.timeline}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Deadline to Apply:</span>
                        <p className="text-white">{project.deadlineToApply}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Created by:</span>
                        <p className="text-white">{project.createdBy}</p>
                      </div>
                    </div>


                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">
                        Posted by: {project.createdBy}
                      </span>
                      {!appliedProjectIds.has(project.id) ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleApplyToProject(project)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                          Apply Now
                        </motion.button>
                      ) : (
                        <span className="text-green-400 font-medium">Applied ✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Briefcase size={48} className="mx-auto mb-4" />
                <p>No new projects available to apply for.</p>
              </div>
            )}
          </motion.div>
        );

              case 'my-applications':
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <h3 className="text-xl font-semibold text-white mb-4">My Applications</h3>
              <p className="text-gray-400 text-sm mb-6">Track your application status</p>
              
              {applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-white">{application.projectTitle}</h4>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          application.status === 'approved' ? 'bg-green-500 text-white' :
                          application.status === 'rejected' ? 'bg-red-500 text-white' :
                          'bg-yellow-500 text-white'
                        }`}>
                          {application.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">
                        Applied: {new Date(application.appliedAt).toLocaleDateString()}
                      </p>
                      <div className="text-sm text-gray-400">
                        Status: {application.status === 'pending' ? 'Under Review' : 
                                 application.status === 'approved' ? 'Congratulations! You\'ve been selected.' : 
                                 'Unfortunately, your application was not selected.'}
                      </div>
                      

                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Send size={48} className="mx-auto mb-4" />
                  <p>You haven't applied to any projects yet.</p>
              </div>
            )}
          </motion.div>
        );

        case 'approved-projects':
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Approved Projects</h3>
              <p className="text-gray-400 text-sm mb-6">View your approved projects with full details</p>
              
              {/* Debug info */}
              <div className="mb-4 p-3 bg-gray-700 rounded text-sm text-gray-300">
                <p>Total Applications: {applications.length}</p>
                <p>Approved Applications: {applications.filter(app => app.status === 'approved').length}</p>
                <p>Total Projects: {projects.length}</p>
              </div>
              
              {applications.filter(app => app.status === 'approved').length > 0 ? (
                <div className="space-y-4">
                  {applications.filter(app => app.status === 'approved').map((application) => {
                    const project = projects.find(p => p.id === application.projectId);
                    if (!project) return null;
                    
                    return (
                      <div key={application.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-white">{project.title}</h4>
                          <span className="px-3 py-1 rounded-full text-sm bg-green-500 text-white">
                            APPROVED
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">
                          Role: {project.role}
                        </p>
                        <p className="text-gray-400 text-sm mb-2">
                          Timeline: {project.timeline}
                        </p>
                        <div className="text-sm text-gray-400 mb-2">
                          <p>Description: {project.description}</p>
                        </div>
                        <div className="text-sm text-gray-400 mb-2">
                          <p>Project Details: {project.projectDetails}</p>
                        </div>
                        <div className="text-sm text-gray-400">
                          Approved on: {new Date(application.appliedAt).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <CheckCircle size={48} className="mx-auto mb-4" />
                  <p>You haven't been approved for any projects yet.</p>
                  <p className="text-sm mt-2">Apply to projects and wait for admin approval to see full details.</p>
                </div>
              )}
            </motion.div>
          );

      case 'notifications':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Notifications</h3>
            <div className="text-center py-12 text-gray-400">
              <Bell size={48} className="mx-auto mb-4" />
              <p>No new notifications.</p>
            </div>
          </motion.div>
        );

      case 'profile':
        return <ProfileSettings />;

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {userProfile?.name}! 👋
          </h1>
          <p className="text-gray-400">Here's what's happening with your projects and applications</p>
        </motion.div>

        {renderContent()}
      </div>

      {/* Application Form Modal */}
      {showApplicationModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 border border-gray-700"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Apply to Project</h3>
              <button
                onClick={() => setShowApplicationModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={applicationForm.username}
                  onChange={(e) => setApplicationForm({...applicationForm, username: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Contact
                </label>
                <input
                  type="text"
                  value={applicationForm.contact}
                  onChange={(e) => setApplicationForm({...applicationForm, contact: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your contact information"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Description about skills
                </label>
                <textarea
                  value={applicationForm.skillsDescription}
                  onChange={(e) => setApplicationForm({...applicationForm, skillsDescription: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Describe your skills and expertise"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Experience
                </label>
                <input
                  type="text"
                  value={applicationForm.experience}
                  onChange={(e) => setApplicationForm({...applicationForm, experience: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Describe your experience"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Deadline to deliver project (days)
                </label>
                <input
                  type="number"
                  value={applicationForm.deadline}
                  onChange={(e) => setApplicationForm({...applicationForm, deadline: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter number of days"
                  min="1"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitApplication}
                  disabled={submitting || !applicationForm.username || !applicationForm.contact || !applicationForm.skillsDescription || !applicationForm.experience || !applicationForm.deadline}
                  className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Message */}
      {applySuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {applySuccess}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
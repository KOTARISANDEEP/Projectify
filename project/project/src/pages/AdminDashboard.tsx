import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, onSnapshot, query, where, doc, updateDoc, deleteDoc, orderBy, addDoc, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { fetchUsersWithRole, formatDate, getUserStatusColor } from '../utils/userUtils';
import { 
  FolderPlus, 
  Clock, 
  CheckCircle, 
  BarChart3, 
  Users, 
  TrendingUp,
  Home,
  UserCheck,
  FileText,
  CheckSquare,
  XCircle,
  Settings,
  LogOut,
  Search,
  Filter,
  Eye,
  Trash2,
  UserX,
  UserPlus,
  Plus,
  Minus
} from 'lucide-react';
import { db, auth } from '../firebase/config';

interface AdminProject {
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

interface UserApplication {
  id: string;
  projectId: string;
  projectTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  username: string;
  contact: string;
  skillsDescription: string;
  experience: string;
  deadline: string;
  appliedAt: string;
  updatedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
}

interface Application {
  id: string;
  projectId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  userName: string;
  projectName: string;
  username?: string;
  contact?: string;
  skillsDescription?: string;
  experience?: string;
  deadline?: string;
  userEmail?: string;
  updatedAt?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
}

interface Team {
  id: string;
  teamName: string;
  members: Array<{
    userId: string;
    userName: string;
  }>;
  createdAt: string;
  createdBy: string;
}

interface StatCard {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  trend?: { value: number; isPositive: boolean };
}

const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [adminProjects, setAdminProjects] = useState<AdminProject[]>([]);
  const [userApplications, setUserApplications] = useState<UserApplication[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // New Projects state
  const [newProjectForm, setNewProjectForm] = useState({
    title: '',
    role: '',
    description: '',
    timeline: '',
    deadlineToApply: '',
    projectDetails: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Create Team state
  const [teamName, setTeamName] = useState('');
  const [maxMembers, setMaxMembers] = useState(5);
  const [selectedUsers, setSelectedUsers] = useState<Array<{userId: string, userName: string}>>([]);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const COLORS = ['#f97316', '#10b981', '#ef4444', '#6b7280'];

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'users', label: 'Users Management', icon: Users },
    { id: 'create-team', label: 'Create Team', icon: UserPlus },
            { id: 'new-projects', label: 'Create Project', icon: FolderPlus },
    { id: 'requests', label: 'Project Requests', icon: FileText },
    { id: 'approved', label: 'Approved Projects', icon: CheckSquare },
    { id: 'rejected', label: 'Rejected Projects', icon: XCircle },
    { id: 'analytics', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'logout', label: 'Logout', icon: LogOut }
  ];

  useEffect(() => {
    // Fetch all admin projects
    const projectsUnsubscribe = onSnapshot(
      query(collection(db, 'adminProjects'), orderBy('createdAt', 'desc')), 
      (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AdminProject));
      setAdminProjects(projectsData);
      setLoading(false);
      }
    );

    // Fetch all user applications
    const applicationsUnsubscribe = onSnapshot(
      query(collection(db, 'userApplications'), orderBy('appliedAt', 'desc')), 
      (snapshot) => {
      const applicationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserApplication));
      setUserApplications(applicationsData);
      }
    );

    // Fetch all users
    const usersUnsubscribe = onSnapshot(
      query(
        collection(db, 'users'), 
        where('role', '==', 'user')
      ), 
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Unknown',
            email: data.email || '',
            role: data.role || 'user',
            status: data.status || 'active',
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
            lastLogin: data.lastLogin?.toDate?.()?.toISOString() || data.lastLogin || null
          } as User;
        });
        // Sort by createdAt if available, otherwise by id
        usersData.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return a.id.localeCompare(b.id);
        });
        console.log('Fetched users:', usersData);
        setUsers(usersData);
      },
      (error) => {
        console.error('Error fetching users with real-time listener:', error);
        // Fallback: fetch users once
        fetchUsersWithRole('user').then(fetchedUsers => {
          console.log('Fallback: fetched users:', fetchedUsers);
          setUsers(fetchedUsers);
        }).catch(fallbackError => {
          console.error('Fallback fetch also failed:', fallbackError);
        });
      }
    );

    // Fetch all teams
    const teamsUnsubscribe = onSnapshot(
      query(collection(db, 'teams'), orderBy('createdAt', 'desc')), 
      (snapshot) => {
        const teamsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Team));
        setTeams(teamsData);
      }
    );

    return () => {
      projectsUnsubscribe();
      applicationsUnsubscribe();
      usersUnsubscribe();
      teamsUnsubscribe();
    };
  }, []);

  const handleNavigation = async (section: string) => {
    if (section === 'logout') {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Error signing out:', error);
      }
      return;
    }
    setActiveSection(section);
  };

  const updateProjectStatus = async (projectId: string, status: 'active' | 'completed', rejectionReason?: string) => {
    try {
      const projectRef = doc(db, 'adminProjects', projectId);
      const updateData: any = { status };
      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
      await updateDoc(projectRef, updateData);
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { status });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      const applicationRef = doc(db, 'userApplications', applicationId);
      await updateDoc(applicationRef, { 
        status,
        updatedAt: new Date().toISOString()
      });
      
      // Show success message
      setSuccessMessage(`Application ${status} successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Force refresh of applications data
      const applicationsRef = collection(db, 'userApplications');
      const snapshot = await getDocs(applicationsRef);
      const applicationsData = snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      } as UserApplication));
      setUserApplications(applicationsData);
      
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const handleAddUserToTeam = (user: User) => {
    if (selectedUsers.length >= maxMembers) {
      alert(`Maximum ${maxMembers} members allowed`);
      return;
    }
    
    if (selectedUsers.find(u => u.userId === user.id)) {
      return; // User already selected
    }
    
    setSelectedUsers([...selectedUsers, { userId: user.id, userName: user.name }]);
  };

  const handleRemoveUserFromTeam = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.userId !== userId));
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      alert('Please enter a team name');
      return;
    }
    
    if (selectedUsers.length === 0) {
      alert('Please select at least one team member');
      return;
    }
    
    setIsCreatingTeam(true);
    
    try {
      await addDoc(collection(db, 'teams'), {
        teamName: teamName.trim(),
        members: selectedUsers,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.uid || 'admin'
      });
      
      // Reset form
      setTeamName('');
      setMaxMembers(5);
      setSelectedUsers([]);
      
      alert('Team created successfully!');
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Error creating team. Please try again.');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const getProjectStats = () => {
    const active = adminProjects.filter(p => p.status === 'active').length;
    const pending = adminProjects.filter(p => p.status === 'pending').length;
    const completed = adminProjects.filter(p => p.status === 'completed').length;
    const total = adminProjects.length;
    
    return { total, approved: active, pending, rejected: completed };
  };

  const getUserStats = () => {
    const active = users.filter(u => u.status === 'active').length;
    const inactive = users.filter(u => u.status === 'inactive').length;
    const pending = users.filter(u => u.status === 'pending').length;
    const total = users.length;
    
    return { total, active, inactive, pending };
  };

  const StatCardComponent: React.FC<StatCard> = ({ title, value, icon: Icon, color, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
      </div>
      </div>
    </motion.div>
  );

  const renderSidebar = () => (
    <div className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-8">Admin Panel</h2>
        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

  return (
              <motion.button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </nav>
      </div>
    </div>
  );

  const renderDashboardView = () => {
    const projectStats = getProjectStats();
    const userStats = getUserStats();
    const recentProjects = adminProjects.slice(0, 5);
    const recentApplications = userApplications.slice(0, 5);

    const getPieChartData = () => [
      { name: 'Approved', value: projectStats.approved, color: COLORS[1] },
      { name: 'Pending', value: projectStats.pending, color: COLORS[0] },
      { name: 'Rejected', value: projectStats.rejected, color: COLORS[2] }
    ].filter(item => item.value > 0);

    return (
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
          <p className="text-gray-400">Monitor and manage your projects and users</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCardComponent
            title="Total Projects"
            value={projectStats.total}
            icon={FolderPlus}
            color="bg-blue-500"
            trend={{ value: 15, isPositive: true }}
          />
          <StatCardComponent
            title="Pending Projects"
            value={projectStats.pending}
            icon={Clock}
            color="bg-yellow-500"
          />
          <StatCardComponent
            title="Total Users"
            value={userStats.total}
            icon={Users}
            color="bg-green-500"
          />
          <StatCardComponent
            title="Active Users"
            value={userStats.active}
            icon={UserCheck}
            color="bg-purple-500"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Project Status Distribution</h3>
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentProjects.map((project) => (
                <div key={project.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                    <h4 className="font-medium text-white">{project.title}</h4>
                      <p className="text-sm text-gray-400">{project.role}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      project.status === 'active' ? 'bg-green-500 text-white' :
                      project.status === 'pending' ? 'bg-yellow-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {project.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  };

  const renderUsersView = () => {
    console.log('All users:', users);
    const filteredUsers = users.filter(user => 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    console.log('Filtered users:', filteredUsers);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Users Management</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setUsersLoading(true);
                fetchUsersWithRole('user').then(fetchedUsers => {
                  setUsers(fetchedUsers);
                  setUsersLoading(false);
                }).catch(() => {
                  setUsersLoading(false);
                });
              }}
              disabled={usersLoading}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {usersLoading ? 'Refreshing...' : 'Refresh Users'}
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {usersLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{user.name}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                        <div className="text-xs text-gray-500">Role: {user.role}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getUserStatusColor(user.status)}`}>
                        {user.status}
                  </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(user.lastLogin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {user.status === 'active' ? (
                        <button
                          onClick={() => updateUserStatus(user.id, 'inactive')}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <UserX size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => updateUserStatus(user.id, 'active')}
                          className="text-green-400 hover:text-green-300 transition-colors"
                        >
                          <UserCheck size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderCreateTeamView = () => {
    console.log('Create Team - All users:', users);
    const availableUsers = users.filter(user => 
      user.role === 'user' &&
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    console.log('Create Team - Available users:', availableUsers);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Create Team</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Team Info Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Team Information</h3>
            
            <div className="space-y-6">
              {/* Team Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Number of Members */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maximum Members
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(parseInt(e.target.value) || 5)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Selected Users */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Selected Members ({selectedUsers.length}/{maxMembers})
                </label>
                <div className="bg-gray-700 rounded-lg p-4 min-h-[120px]">
                  {selectedUsers.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No members selected</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedUsers.map((user) => (
                        <div key={user.userId} className="flex items-center justify-between bg-gray-600 rounded-lg p-3">
                          <span className="text-white font-medium">{user.userName}</span>
                          <button
                            onClick={() => handleRemoveUserFromTeam(user.userId)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Minus size={18} />
                          </button>
                </div>
              ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Create Team Button */}
              <button
                onClick={handleCreateTeam}
                disabled={isCreatingTeam || !teamName.trim() || selectedUsers.length === 0}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {isCreatingTeam ? 'Creating Team...' : 'Create Team'}
              </button>
            </div>
          </motion.div>

          {/* Right Side - Available Users */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Available Users</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setUsersLoading(true);
                    fetchUsersWithRole('user').then(fetchedUsers => {
                      setUsers(fetchedUsers);
                      setUsersLoading(false);
                    }).catch(() => {
                      setUsersLoading(false);
                    });
                  }}
                  disabled={usersLoading}
                  className="px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
                >
                  {usersLoading ? '...' : 'Refresh'}
                </button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {usersLoading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-400">Loading users...</p>
                </div>
              ) : availableUsers.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No available users found</p>
              ) : (
                availableUsers.map((user) => {
                  const isSelected = selectedUsers.find(u => u.userId === user.id) !== undefined;
                  const isMaxReached = selectedUsers.length >= maxMembers;
                  
                  return (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                        isSelected 
                          ? 'bg-orange-500/20 border-orange-500' 
                          : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      }`}
                    >
                      <div>
                        <div className="text-white font-medium">{user.name}</div>
                        <div className="text-gray-400 text-sm">{user.email}</div>
                       <div className="text-gray-500 text-xs">Role: {user.role}</div>
                      </div>
                      
                      <button
                        onClick={() => handleAddUserToTeam(user)}
                        disabled={isSelected || isMaxReached}
                        className={`p-2 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-orange-500 text-white cursor-not-allowed'
                            : isMaxReached
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {isSelected ? <CheckCircle size={18} /> : <Plus size={18} />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>

        {/* Existing Teams */}
        {teams.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Existing Teams</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <div key={team.id} className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">{team.teamName}</h4>
                  <p className="text-gray-400 text-sm mb-3">
                    {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                  </p>
                  <div className="space-y-1">
                    {team.members.slice(0, 3).map((member) => (
                      <div key={member.userId} className="text-sm text-gray-300">
                        • {member.userName}
            </div>
                    ))}
                    {team.members.length > 3 && (
                      <div className="text-sm text-gray-400">
                        +{team.members.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  const renderProjectsView = (status: 'pending' | 'active' | 'completed') => {
    const filteredProjects = adminProjects.filter(project => project.status === status);
    const titles = {
      pending: 'Pending Projects',
      active: 'Active Projects',
      completed: 'Completed Projects'
    };

    // For pending projects, we'll show pending applications
    if (status === 'pending') {
      const pendingApplications = userApplications.filter(app => app.status === 'pending');
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Project Requests</h1>
            <div className="text-sm text-gray-400">
              Total Applications: {pendingApplications.length}
            </div>
          </div>

          {pendingApplications.length > 0 ? (
            <div className="space-y-6">
              {pendingApplications.map((application) => (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700"
                >
                                  <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white">{application.projectTitle}</h3>
                  <span className="px-2 py-1 rounded-full text-xs bg-yellow-500 text-white">
                    PENDING
                  </span>
                </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                      <h4 className="text-md font-semibold text-orange-400 mb-3">Applicant Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-400">Username:</span> <span className="text-white">{application.userName || 'N/A'}</span></div>
                        <div><span className="text-gray-400">Contact:</span> <span className="text-white">{application.contact || 'N/A'}</span></div>
                        <div><span className="text-gray-400">Experience:</span> <span className="text-white">{application.experience || 'N/A'}</span></div>
                        <div><span className="text-gray-400">Deadline:</span> <span className="text-white">{application.deadline || 'N/A'} days</span></div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-md font-semibold text-orange-400 mb-3">Skills & Description</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-gray-400">Skills Description:</span></div>
                        <p className="text-white text-sm bg-gray-700 p-3 rounded-lg">
                          {application.skillsDescription || 'No description provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => updateApplicationStatus(application.id, 'approved')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => updateApplicationStatus(application.id, 'rejected')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No project requests available.</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">{titles[status]}</h1>
          <div className="text-sm text-gray-400">
            Total: {filteredProjects.length}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-white">{project.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  project.status === 'active' ? 'bg-green-500 text-white' :
                  project.status === 'pending' ? 'bg-yellow-500 text-white' :
                  'bg-red-500 text-white'
                }`}>
                  {project.status.toUpperCase()}
                </span>
              </div>
              
              <p className="text-gray-400 text-sm mb-4 line-clamp-3">{project.description}</p>
              
              <div className="space-y-2 text-sm text-gray-400 mb-4">
                <div>Role: <span className="text-white">{project.role}</span></div>
                <div>Timeline: <span className="text-white">{project.timeline}</span></div>
                <div>Deadline to Apply: <span className="text-white">{project.deadlineToApply}</span></div>
                <div>Created by: <span className="text-white">{project.createdBy}</span></div>
              </div>

              {/* Project approval buttons are now handled in the applications view for pending projects */}
            </motion.div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No {status} projects found.</p>
          </div>
        )}
      </div>
    );
  };

  const renderAnalyticsView = () => {
    const projectStats = getProjectStats();
    const userStats = getUserStats();
    
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(2024, i).toLocaleDateString('en-US', { month: 'short' });
      const projectsCount = Math.floor(Math.random() * 10) + i;
      const usersCount = Math.floor(Math.random() * 20) + i * 2;
      return { month, projects: projectsCount, users: usersCount };
    });

    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCardComponent
            title="Total Projects"
            value={projectStats.total}
            icon={FolderPlus}
            color="bg-blue-500"
          />
          <StatCardComponent
            title="Approved Projects"
            value={projectStats.approved}
            icon={CheckCircle}
            color="bg-green-500"
          />
          <StatCardComponent
            title="Total Users"
            value={userStats.total}
            icon={Users}
            color="bg-purple-500"
          />
          <StatCardComponent
            title="Active Users"
            value={userStats.active}
            icon={UserCheck}
            color="bg-orange-500"
          />
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Monthly Growth</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyData}>
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
              <Line type="monotone" dataKey="projects" stroke="#f97316" strokeWidth={2} />
              <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} />
            </LineChart>
            </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderApprovedApplicationsView = () => {
    const approvedApplications = userApplications.filter(app => app.status === 'approved');
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Approved Applications</h1>
          <div className="text-sm text-gray-400">
            Total Approved: {approvedApplications.length}
          </div>
        </div>

        {approvedApplications.length > 0 ? (
          <div className="space-y-6">
            {approvedApplications.map((application) => (
          <motion.div
                key={application.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white">{application.projectTitle}</h3>
                  <span className="px-2 py-1 rounded-full text-xs bg-green-500 text-white">
                    APPROVED
                    </span>
                  </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <h4 className="text-md font-semibold text-green-400 mb-3">Applicant Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-400">Username:</span> <span className="text-white">{application.userName || 'N/A'}</span></div>
                      <div><span className="text-gray-400">Contact:</span> <span className="text-white">{application.contact || 'N/A'}</span></div>
                      <div><span className="text-gray-400">Experience:</span> <span className="text-white">{application.experience || 'N/A'}</span></div>
                      <div><span className="text-gray-400">Deadline:</span> <span className="text-white">{application.deadline || 'N/A'} days</span></div>
                  </div>
                </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-md font-semibold text-green-400 mb-3">Skills & Description</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-400">Skills Description:</span></div>
                      <p className="text-white text-sm bg-gray-700 p-3 rounded-lg">
                        {application.skillsDescription || 'No description provided'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-400">
                  <div>Approved on: {new Date(application.updatedAt || application.appliedAt).toLocaleDateString()}</div>
            </div>
          </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">No approved applications found.</p>
          </div>
        )}
      </div>
    );
  };

  const renderRejectedApplicationsView = () => {
    const rejectedApplications = userApplications.filter(app => app.status === 'rejected');
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Rejected Applications</h1>
          <div className="text-sm text-gray-400">
            Total Rejected: {rejectedApplications.length}
          </div>
        </div>

        {rejectedApplications.length > 0 ? (
          <div className="space-y-6">
            {rejectedApplications.map((application) => (
          <motion.div
                key={application.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white">{application.projectTitle}</h3>
                  <span className="px-2 py-1 rounded-full text-xs bg-red-500 text-white">
                    REJECTED
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <h4 className="text-md font-semibold text-red-400 mb-3">Applicant Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-400">Username:</span> <span className="text-white">{application.userName || 'N/A'}</span></div>
                      <div><span className="text-gray-400">Contact:</span> <span className="text-white">{application.contact || 'N/A'}</span></div>
                      <div><span className="text-gray-400">Experience:</span> <span className="text-white">{application.experience || 'N/A'}</span></div>
                      <div><span className="text-gray-400">Deadline:</span> <span className="text-white">{application.deadline || 'N/A'} days</span></div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-md font-semibold text-red-400 mb-3">Skills & Description</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-400">Skills Description:</span></div>
                      <p className="text-white text-sm bg-gray-700 p-3 rounded-lg">
                        {application.skillsDescription || 'No description provided'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-400">
                  <div>Rejected on: {new Date(application.updatedAt || application.appliedAt).toLocaleDateString()}</div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">No rejected applications found.</p>
          </div>
        )}
      </div>
    );
  };

  const renderNewProjectsView = () => {

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newProjectForm.title || !newProjectForm.description) return;

      setSubmitting(true);
      try {
        // Get the current Firebase ID token
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          throw new Error('No authentication token available');
        }

        // Use the new API endpoint that handles email notifications
        const response = await fetch('https://projectify-rrv0.onrender.com/api/admin-projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            title: newProjectForm.title,
            role: newProjectForm.role,
            description: newProjectForm.description,
            timeline: newProjectForm.timeline,
            deadlineToApply: newProjectForm.deadlineToApply,
            projectDetails: newProjectForm.projectDetails
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          // Reset form
          setNewProjectForm({
            title: '',
            role: '',
            description: '',
            timeline: '',
            deadlineToApply: '',
            projectDetails: ''
          });

          // Show success message with notification details
          const notificationInfo = result.project.notifications;
          if (notificationInfo && !notificationInfo.error) {
            setSuccessMessage(`Project created successfully! 📧 Email notifications sent to ${notificationInfo.emailsSent} users.`);
          } else if (notificationInfo && notificationInfo.error) {
            setSuccessMessage(`Project created successfully! ⚠️ Email notifications failed: ${notificationInfo.error}`);
          } else {
            setSuccessMessage('Project created successfully! Users can now see and apply to this project.');
          }
          
          setTimeout(() => setSuccessMessage(null), 5000);
        } else {
          throw new Error(result.message || 'Failed to create project');
        }
      } catch (error) {
        console.error('Error creating project:', error);
        setSuccessMessage(`Error creating project: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setTimeout(() => setSuccessMessage(null), 5000);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Create New Project</h1>
          <p className="text-gray-400">Create new projects that users can immediately see and apply to</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Title for the Role *
                </label>
                <input
                  type="text"
                  value={newProjectForm.title}
                  onChange={(e) => setNewProjectForm({...newProjectForm, title: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter project title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Role *
                </label>
                <input
                  type="text"
                  value={newProjectForm.role}
                  onChange={(e) => setNewProjectForm({...newProjectForm, role: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., Frontend Developer, Full Stack Engineer"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Project Description *
              </label>
              <textarea
                value={newProjectForm.description}
                onChange={(e) => setNewProjectForm({...newProjectForm, description: e.target.value})}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Describe the project requirements and objectives"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Timeline
                </label>
                <input
                  type="text"
                  value={newProjectForm.timeline}
                  onChange={(e) => setNewProjectForm({...newProjectForm, timeline: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., 3-6 months, ASAP"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Deadline to Apply
                </label>
                <input
                  type="date"
                  value={newProjectForm.deadlineToApply}
                  onChange={(e) => setNewProjectForm({...newProjectForm, deadlineToApply: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Detailed Project Requirements (Hidden until user is approved)
              </label>
              <textarea
                value={newProjectForm.projectDetails}
                onChange={(e) => setNewProjectForm({...newProjectForm, projectDetails: e.target.value})}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter detailed project information, technical requirements, budget, etc. This will only be visible to users AFTER you approve their application."
                rows={6}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={submitting || !newProjectForm.title || !newProjectForm.description}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FolderPlus size={20} className="mr-2" />
                    Create Project
                  </>
                )}
              </button>
            </div>
          </form>
        </div>


      </div>
    );
  };

  const renderSettingsView = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Admin Profile</h3>
            <div className="space-y-4">
                    <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
              <input
                type="text"
                value="Admin User"
                readOnly
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
                    </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value="admin@example.com"
                readOnly
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
                  </div>
                  </div>
                </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">System Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Email Notifications</span>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Auto-approve Projects</span>
              <input type="checkbox" className="toggle" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Maintenance Mode</span>
              <input type="checkbox" className="toggle" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboardView();
      case 'users':
        return renderUsersView();
      case 'create-team':
        return renderCreateTeamView();
      case 'new-projects':
        return renderNewProjectsView();
      case 'requests':
        return renderProjectsView('pending');
      case 'approved':
        return renderApprovedApplicationsView();
      case 'rejected':
        return renderRejectedApplicationsView();
      case 'analytics':
        return renderAnalyticsView();
      case 'settings':
        return renderSettingsView();
      default:
        return renderDashboardView();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-900">
        {renderSidebar()}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      {renderSidebar()}
      <div className="flex-1 p-8">
        {renderContent()}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
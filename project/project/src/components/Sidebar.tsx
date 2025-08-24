import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FolderPlus, 
  Settings, 
  BarChart3, 
  CheckSquare, 
  LogOut,
  User,
  Bell,
  Folder
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isAdmin?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isAdmin = false }) => {
  const { logout, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: FolderPlus, label: 'Post Project', path: '/admin/post-project' },
    { icon: Settings, label: 'Manage Projects', path: '/admin/manage-projects' },
    { icon: CheckSquare, label: 'Approvals', path: '/admin/approvals' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' }
  ];

  const userMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/user/dashboard' },
    { icon: Folder, label: 'Available Projects', path: '/user/projects' },
    { icon: CheckSquare, label: 'My Applications', path: '/user/applications' },
    { icon: Bell, label: 'Notifications', path: '/user/notifications' },
    { icon: User, label: 'Profile', path: '/user/profile' }
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-orange-400">Projectify</h1>
        <p className="text-sm text-gray-400 mt-1">
          {isAdmin ? 'Admin Portal' : 'User Portal'}
        </p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <User size={20} />
          </div>
          <div>
            <p className="text-sm font-medium">{userProfile?.name || 'User'}</p>
            <p className="text-xs text-gray-400 capitalize">{userProfile?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <motion.li
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 hover:bg-gray-800 ${
                    isActive ? 'bg-orange-500 text-white' : 'text-gray-300 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </motion.li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full p-3 text-gray-300 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
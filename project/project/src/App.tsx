import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminPostProject from './pages/AdminPostProject';
import AdminManageProjects from './pages/AdminManageProjects';
import ProfileSettings from './pages/ProfileSettings';

// Loading component
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <h2 className="text-2xl font-bold text-orange-400 mb-2">Projectify</h2>
      <p className="text-gray-400">Loading...</p>
    </div>
  </div>
);

// Home redirect component
const HomeRedirect: React.FC = () => {
  const { userProfile } = useAuth();
  
  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }
  
  return <Navigate to={userProfile.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Home redirect */}
            <Route path="/" element={<HomeRedirect />} />
            
            {/* User Routes */}
            <Route path="/user/dashboard" element={
              <ProtectedRoute requiredRole="user">
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="/user/profile" element={
              <ProtectedRoute requiredRole="user">
                <ProfileSettings />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/post-project" element={
              <ProtectedRoute requiredRole="admin">
                <AdminPostProject />
              </ProtectedRoute>
            } />
            <Route path="/admin/manage-projects" element={
              <ProtectedRoute requiredRole="admin">
                <AdminManageProjects />
              </ProtectedRoute>
            } />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
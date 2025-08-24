import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, onSnapshot, doc, updateDoc, query, where } from 'firebase/firestore';
import { Settings, CheckCircle, Clock, Eye, Calendar, DollarSign } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { db } from '../firebase/config';

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: string;
  createdBy: string;
  createdAt: string;
}

interface Application {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: string;
  appliedAt: string;
}

const AdminManageProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch projects
    const projectsUnsubscribe = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));
      setProjects(projectsData.sort((a, b) => 
        new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
      ));
      setLoading(false);
    });

    // Fetch applications
    const applicationsUnsubscribe = onSnapshot(collection(db, 'applications'), (snapshot) => {
      const applicationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Application));
      setApplications(applicationsData);
    });

    return () => {
      projectsUnsubscribe();
      applicationsUnsubscribe();
    };
  }, []);

  const handleApproveProject = async (projectId: string) => {
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        status: 'approved'
      });
    } catch (error) {
      console.error('Error approving project:', error);
    }
  };

  const handleRejectProject = async (projectId: string) => {
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        status: 'rejected'
      });
    } catch (error) {
      console.error('Error rejecting project:', error);
    }
  };

  const getFilteredProjects = () => {
    if (selectedFilter === 'all') return projects;
    return projects.filter(project => project.status === selectedFilter);
  };

  const getProjectApplications = (projectId: string) => {
    return applications.filter(app => app.projectId === projectId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-400 bg-green-500/10 border-green-500/50';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/50';
      case 'rejected':
        return 'text-red-400 bg-red-500/10 border-red-500/50';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/50';
    }
  };

  const filteredProjects = getFilteredProjects();

  if (loading) {
    return (
      <div className="flex">
        <Sidebar isAdmin />
        <div className="flex-1 bg-gray-900 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar isAdmin />
      
      <div className="flex-1 p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-4">
                <Settings size={32} className="text-orange-500 mr-3" />
                <h1 className="text-3xl font-bold text-white">Manage Projects</h1>
              </div>
              <p className="text-gray-400">Review and approve project submissions</p>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex space-x-2">
              {['all', 'pending', 'approved'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter as 'all' | 'pending' | 'approved')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedFilter === filter
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  <span className="ml-2 text-xs">
                    ({filter === 'all' ? projects.length : projects.filter(p => p.status === filter).length})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => {
            const projectApplications = getProjectApplications(project.id);
            
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-white truncate">{project.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                    {project.status.toUpperCase()}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-4 line-clamp-3">{project.description}</p>

                {/* Project Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-400">
                    <Calendar size={16} className="mr-2 text-orange-500" />
                    <span>{new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <DollarSign size={16} className="mr-2 text-green-500" />
                    <span>${project.budget?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <Eye size={16} className="mr-2 text-blue-500" />
                    <span>{projectApplications.length} applications</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {project.status === 'pending' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleApproveProject(project.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <CheckCircle size={16} className="mr-1" />
                        Approve
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRejectProject(project.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                      >
                        Reject
                      </motion.button>
                    </>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedProject(project)}
                    className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center"
                  >
                    <Eye size={16} className="mr-1" />
                    View Details
                  </motion.button>
                </div>

                {/* Applications Preview */}
                {projectApplications.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Recent Applications</h4>
                    <div className="space-y-2">
                      {projectApplications.slice(0, 2).map(app => (
                        <div key={app.id} className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">{app.userName}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            app.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            app.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      ))}
                      {projectApplications.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{projectApplications.length - 2} more applications
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-gray-400 text-lg">No projects found</div>
            <div className="text-gray-500 text-sm mt-2">
              {selectedFilter === 'all' 
                ? 'Create your first project to get started' 
                : `No ${selectedFilter} projects at the moment`
              }
            </div>
          </motion.div>
        )}

        {/* Project Details Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">{selectedProject.name}</h2>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                  <p className="text-gray-400">{selectedProject.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Start Date</h3>
                    <p className="text-gray-400">{new Date(selectedProject.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">End Date</h3>
                    <p className="text-gray-400">{new Date(selectedProject.endDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Budget</h3>
                  <p className="text-gray-400">${selectedProject.budget?.toLocaleString() || 'N/A'}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Applications ({getProjectApplications(selectedProject.id).length})</h3>
                  <div className="space-y-2">
                    {getProjectApplications(selectedProject.id).map(app => (
                      <div key={app.id} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-white">{app.userName}</p>
                            <p className="text-sm text-gray-400">{app.userEmail}</p>
                            <p className="text-xs text-gray-500">Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            app.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            app.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {app.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManageProjects;
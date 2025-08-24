import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { addDoc, collection } from 'firebase/firestore';
import { FolderPlus, Calendar, DollarSign, FileText } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const AdminPostProject: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { userProfile } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'projects'), {
        ...formData,
        budget: parseFloat(formData.budget),
        status: 'pending',
        createdBy: userProfile?.email,
        createdAt: new Date().toISOString()
      });

      setSuccess(true);
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        budget: ''
      });

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error creating project:', error);
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar isAdmin />
      
      <div className="flex-1 p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center mb-4">
            <FolderPlus size={32} className="text-orange-500 mr-3" />
            <h1 className="text-3xl font-bold text-white">Post New Project</h1>
          </div>
          <p className="text-gray-400">Create a new project for users to apply to</p>
        </motion.div>

        <div className="max-w-2xl">
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/50 text-green-400 px-6 py-4 rounded-lg mb-6"
            >
              Project created successfully! It's now pending approval.
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-xl p-8 border border-gray-700"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Name */}
              <div>
                <label htmlFor="name" className="flex items-center text-sm font-medium text-gray-300 mb-2">
                  <FileText size={16} className="mr-2" />
                  Project Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  placeholder="Enter project name"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Project Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors resize-none"
                  placeholder="Describe the project details, requirements, and expectations..."
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startDate" className="flex items-center text-sm font-medium text-gray-300 mb-2">
                    <Calendar size={16} className="mr-2" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="flex items-center text-sm font-medium text-gray-300 mb-2">
                    <Calendar size={16} className="mr-2" />
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  />
                </div>
              </div>

              {/* Budget */}
              <div>
                <label htmlFor="budget" className="flex items-center text-sm font-medium text-gray-300 mb-2">
                  <DollarSign size={16} className="mr-2" />
                  Project Budget
                </label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  placeholder="Enter budget amount"
                />
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <FolderPlus size={20} className="mr-2" />
                )}
                {loading ? 'Creating Project...' : 'Create Project'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminPostProject;
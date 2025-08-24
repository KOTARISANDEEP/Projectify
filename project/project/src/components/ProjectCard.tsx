import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, Users, Clock } from 'lucide-react';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    budget: number;
    status: string;
  };
  showApplyButton?: boolean;
  onApply?: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, showApplyButton = false, onApply }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500 transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-white truncate">{project.name}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(project.status)}`}>
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </span>
      </div>

      <p className="text-gray-400 text-sm mb-4 line-clamp-3">{project.description}</p>

      <div className="space-y-2 mb-6">
        <div className="flex items-center text-sm text-gray-400">
          <Calendar size={16} className="mr-2" />
          <span>{new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center text-sm text-gray-400">
          <DollarSign size={16} className="mr-2" />
          <span>${project.budget.toLocaleString()}</span>
        </div>
        <div className="flex items-center text-sm text-gray-400">
          <Clock size={16} className="mr-2" />
          <span>Duration: {Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} days</span>
        </div>
      </div>

      {showApplyButton && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onApply?.(project.id)}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Apply Now
        </motion.button>
      )}
    </motion.div>
  );
};

export default ProjectCard;
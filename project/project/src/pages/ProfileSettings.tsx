import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Edit3, Save, Camera, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface ProfileFormData {
  name: string;
  jobTitle: string;
  experience: string;
  techStack: string;
  bio: string;
}

const ProfileSettings: React.FC = () => {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    jobTitle: '',
    experience: '',
    techStack: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string>('');

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        jobTitle: userProfile.jobTitle || '',
        experience: userProfile.experience || '',
        techStack: userProfile.techStack || '',
        bio: userProfile.bio || ''
      });
      setProfilePicture(userProfile.profilePicture || '');
    }
  }, [userProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    setLoading(true);
    setSuccessMessage('');

    try {
      const userRef = doc(db, 'users', userProfile.id);
      await updateDoc(userRef, {
        name: formData.name,
        jobTitle: formData.jobTitle,
        experience: formData.experience,
        techStack: formData.techStack,
        bio: formData.bio,
        updatedAt: new Date().toISOString()
      });

      setSuccessMessage('Profile updated successfully! 🎉');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSuccessMessage('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Profile Settings</h1>
          <p className="text-gray-400 text-lg">Manage your professional profile and personal information</p>
        </motion.div>

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg border ${
              successMessage.includes('successfully') 
                ? 'bg-green-500/20 border-green-500/50 text-green-300' 
                : 'bg-red-500/20 border-red-500/50 text-red-300'
            }`}
          >
            {successMessage}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-8 border border-gray-600/50"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                <button
                  onClick={toggleEdit}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isEditing 
                      ? 'bg-gray-600 text-white hover:bg-gray-500' 
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  {isEditing ? <X size={16} /> : <Edit3 size={16} />}
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email Field (Read-only) */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userProfile.email}
                    disabled
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-300 cursor-not-allowed"
                    placeholder="Email address"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Role Field (Read-only) */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={userProfile.role}
                    disabled
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-gray-300 cursor-not-allowed capitalize"
                    placeholder="User role"
                  />
                  <p className="text-xs text-gray-500 mt-1">Role is determined by your account type</p>
                </div>

                {/* Job Title Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g., Frontend Developer, Full Stack Engineer"
                  />
                </div>

                {/* Experience Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Experience
                  </label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g., 3 years, 2.5 years, 18 months"
                  />
                </div>

                {/* Tech Stack Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Tech Stack / Skills
                  </label>
                  <input
                    type="text"
                    name="techStack"
                    value={formData.techStack}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g., React, Node.js, Python, AWS, Docker"
                  />
                </div>

                {/* Bio Field */}
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    About Me / Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                    placeholder="Tell us about yourself, your passion for technology, and what drives you..."
                  />
                </div>

                {/* Submit Button */}
                {isEditing && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Save size={20} className="mr-2" />
                    )}
                    {loading ? 'Updating Profile...' : 'Update Profile'}
                  </motion.button>
                )}
              </form>
            </motion.div>
          </div>

          {/* Right Column - Profile Preview */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-600/50 sticky top-8"
            >
              <h3 className="text-xl font-bold text-white mb-6 text-center">Profile Preview</h3>
              
              {/* Profile Picture */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {profilePicture ? (
                      <img 
                        src={profilePicture} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      userProfile.name?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                  <button className="absolute -bottom-2 -right-2 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full transition-colors">
                    <Camera size={16} />
                  </button>
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="text-xl font-bold text-white">{formData.name || 'Your Name'}</h4>
                  <p className="text-orange-400 font-medium">{formData.jobTitle || 'Job Title'}</p>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Experience</p>
                    <p className="text-white font-medium">{formData.experience || 'Not specified'}</p>
                  </div>

                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Tech Stack</p>
                    <p className="text-white font-medium">{formData.techStack || 'Not specified'}</p>
                  </div>

                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">About Me</p>
                    <p className="text-white text-sm leading-relaxed">
                      {formData.bio || 'No bio added yet. Click Edit Profile to add your bio!'}
                    </p>
                  </div>

                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Account Type</p>
                    <p className="text-white font-medium capitalize">{userProfile.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;


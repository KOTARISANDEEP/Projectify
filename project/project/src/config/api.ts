// API Configuration
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://projectify-rrv0.onrender.com'  // Production: Render backend
  : 'http://localhost:5001';                // Development: Local backend

export const API_ENDPOINTS = {
  ADMIN_PROJECTS: `${API_BASE_URL}/api/admin-projects`,
  PROJECTS: `${API_BASE_URL}/api/projects`,
  APPLICATIONS: `${API_BASE_URL}/api/applications`,
  AUTH: `${API_BASE_URL}/api/auth`,
  USERS: `${API_BASE_URL}/api/users`,
  ANALYTICS: `${API_BASE_URL}/api/analytics`,
};

export default API_BASE_URL;

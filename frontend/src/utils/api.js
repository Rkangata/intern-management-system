import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// ====================================================
// 🔐 Attach JWT token to every request if available
// ====================================================
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ====================================================
// 🧍 AUTH APIs
// ====================================================

export const register = (formData) =>
  API.post('/auth/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const login = (credentials) => API.post('/auth/login', credentials);

export const getProfile = () => API.get('/auth/me');

export const updateProfile = (formData) =>
  API.put('/auth/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ✅ Forgot Password API (optional if you added it in backend)
export const forgotPassword = (email) =>
  API.post('/auth/forgot-password', { email });

// ====================================================
// 📄 APPLICATION APIs
// ====================================================

export const submitApplication = (formData) =>
  API.post('/applications', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getMyApplications = () => API.get('/applications/my-applications');

export const getAllApplications = (status) => {
  const url = status ? `/applications?status=${status}` : '/applications';
  return API.get(url);
};

export const getApplication = (id) => API.get(`/applications/${id}`);

export const hrReviewApplication = (id, comments) =>
  API.put(`/applications/${id}/hr-review`, { comments });

export const hodReviewApplication = (id, action, comments) =>
  API.put(`/applications/${id}/hod-review`, { action, comments });

export const updateApplication = (id, formData) =>
  API.put(`/applications/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ====================================================
// 📊 ANALYTICS APIs
// ====================================================

// ✅ Analytics API
export const getAnalytics = () => API.get('/applications/analytics/stats');

// ====================================================
// 🏢 DEPARTMENT APIs
// ====================================================

// ✅ Get all departments
export const getDepartments = () => API.get('/departments');

// ✅ Get subdepartments for a specific department
export const getSubdepartments = (departmentCode) =>
  API.get(`/departments/${departmentCode}/subdepartments`);

// ✅ Set user’s assigned department and subdepartment
export const setUserDepartment = (department, subdepartment) =>
  API.put('/auth/set-department', { department, subdepartment });

export default API;

import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==========================
// AUTH APIs
// ==========================
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

export const setUserDepartment = (department, subdepartment) =>
  API.put('/auth/set-department', { department, subdepartment });

// ==========================
// DEPARTMENT APIs
// ==========================
export const getDepartments = () => API.get('/departments');
export const getSubdepartments = (departmentCode) =>
  API.get(`/departments/${departmentCode}/subdepartments`);

// ==========================
// APPLICATION APIs
// ==========================
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

// ✅ Updated HR review with HOD department assignment
export const hrReviewApplication = (id, comments, hodDepartment, hodSubdepartment) =>
  API.put(`/applications/${id}/hr-review`, {
    comments,
    hodDepartment,
    hodSubdepartment,
  });

export const hodReviewApplication = (id, action, comments) =>
  API.put(`/applications/${id}/hod-review`, { action, comments });

export const updateApplication = (id, formData) =>
  API.put(`/applications/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ==========================
// ANALYTICS APIs
// ==========================
export const getAnalytics = () => API.get('/applications/analytics/stats');

export default API;

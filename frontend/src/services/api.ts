import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Interceptor to attach JWT token if present in localStorage or memory
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fixloop_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear local session on unauthenticated response
      localStorage.removeItem('fixloop_token');
    }
    return Promise.reject(error);
  }
);

export default api;


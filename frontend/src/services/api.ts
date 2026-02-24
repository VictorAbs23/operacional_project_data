import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isPublicAuthRequest = ['/auth/login', '/auth/forgot-password', '/auth/reset-password'].some(
      (path) => error.config?.url?.startsWith(path)
    );
    if (error.response?.status === 401 && !isPublicAuthRequest) {
      useAuthStore.getState().logout();
      window.location.replace('/login');
    }
    return Promise.reject(error);
  },
);

export default api;

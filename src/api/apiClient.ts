import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { useAuthStore } from '../stores/authStore';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized (Expired or Invalid Token)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const originalRequestUrl = error.config?.url || '';
      // Do not logout if 401 occurred on the login/register screen due to wrong PIN
      const isLoginOrRegister =
        originalRequestUrl.includes('/auth/login') ||
        originalRequestUrl.includes('/auth/register');

      if (!isLoginOrRegister) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

import axios from 'axios';
import { performRefreshToken } from './refreshTokenManager';
import { getCookie, clearAllAuthCookies } from './cookieHelper';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = getCookie('_super_x_tkn');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';

    const isAuthAction = 
      url.includes('/auth/login') || 
      url.includes('/auth/change-password') || 
      url.includes('/auth/2fa') ||
      url.includes('/auth/refresh-token');

    if (error.response?.status === 401 && !isAuthAction && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            const newToken = getCookie('_super_x_tkn');
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await performRefreshToken();
        processQueue(null);
        const newToken = getCookie('_super_x_tkn');
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        localStorage.removeItem('user');
        localStorage.removeItem('adminLoginTime');
        clearAllAuthCookies();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401 && !isAuthAction && originalRequest._retry) {
      localStorage.removeItem('user');
      localStorage.removeItem('adminLoginTime');
      clearAllAuthCookies();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

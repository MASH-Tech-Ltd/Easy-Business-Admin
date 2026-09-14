import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/_content-sync';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Access tokens are handled automatically via HttpOnly cookies

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
        // The backend automatically sets the new _x_sess_tkn cookie
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

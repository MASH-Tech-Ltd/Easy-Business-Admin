import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

let refreshTokenPromise = null;

export const performRefreshToken = () => {
  if (!refreshTokenPromise) {
    refreshTokenPromise = axios
      .post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true })
      .then((res) => res.data)
      .finally(() => {
        refreshTokenPromise = null;
      });
  }
  return refreshTokenPromise;
};

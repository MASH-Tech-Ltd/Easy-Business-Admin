import axios from 'axios';
import { setCookie } from './cookieHelper';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

let refreshTokenPromise = null;

export const performRefreshToken = () => {
  if (!refreshTokenPromise) {
    refreshTokenPromise = axios
      .post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true })
      .then((res) => {
        const newAccessToken = res.data?.data?.accessToken;
        if (newAccessToken) {
          setCookie('_super_x_tkn', newAccessToken, 24);
        }
        return res.data;
      })
      .finally(() => {
        refreshTokenPromise = null;
      });
  }
  return refreshTokenPromise;
};

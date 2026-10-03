import { Navigate, useLocation } from 'react-router-dom';
import { getCookie, setCookie, clearAllAuthCookies, SESSION_HOURS } from '../utils/cookieHelper';

const SESSION_DURATION = SESSION_HOURS * 60 * 60 * 1000;

export default function RequireAuth({ children }) {
  const userStr = localStorage.getItem('user');
  const sessTimeStr = getCookie('_admin_sess_time') || localStorage.getItem('adminLoginTime');
  const location = useLocation();

  let user = null;
  try {
    if (userStr) user = JSON.parse(userStr);
  } catch (e) {}

  const isExpired = sessTimeStr && (Date.now() - parseInt(sessTimeStr, 10) > SESSION_DURATION);

  if (!user || user.role !== 'super_admin' || isExpired) {
    localStorage.removeItem('user');
    localStorage.removeItem('adminLoginTime');
    clearAllAuthCookies();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!sessTimeStr && user && user.role === 'super_admin') {
    setCookie('_admin_sess_time', Date.now().toString(), SESSION_HOURS);
  }

  return children;
}


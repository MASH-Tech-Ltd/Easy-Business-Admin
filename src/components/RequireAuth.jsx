import { Navigate, useLocation } from 'react-router-dom';

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export default function RequireAuth({ children }) {
  const userStr = localStorage.getItem('user');
  const loginTimeStr = localStorage.getItem('adminLoginTime');
  const location = useLocation();

  let user = null;
  try {
    if (userStr) user = JSON.parse(userStr);
  } catch (e) {}

  const isExpired = loginTimeStr && (Date.now() - parseInt(loginTimeStr, 10) > TWENTY_FOUR_HOURS);

  if (!user || user.role !== 'super_admin' || isExpired) {
    localStorage.removeItem('user');
    localStorage.removeItem('adminLoginTime');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

import { Navigate, useLocation } from 'react-router-dom';

export default function RequireAuth({ children }) {
  const token = localStorage.getItem('accessToken');
  const userStr = localStorage.getItem('user');
  const location = useLocation();

  let user = null;
  try {
    if (userStr) user = JSON.parse(userStr);
  } catch (e) {}

  if (!user || user.role !== 'super_admin') {
    localStorage.removeItem('user');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

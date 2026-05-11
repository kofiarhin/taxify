import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export function RoleRoute({ roles }) {
  const { user } = useSelector((state) => state.auth);
  if (!user || !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return <Outlet />;
}

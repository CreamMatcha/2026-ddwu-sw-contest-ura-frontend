import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/AppStore';

export function RequireAuth() {
  const { auth } = useAppStore();
  const location = useLocation();
  if (!auth) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

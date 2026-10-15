import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/use-auth.js';
import { LoadingScreen } from '../components/common/async-states.js';

/**
 * Renders the protected route interface.
 */
export function ProtectedRoute() {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <LoadingScreen label="Restoring your session" />;
  return user ? (
    <Outlet />
  ) : (
    <Navigate
      to="/login"
      replace
      state={{ from: `${location.pathname}${location.search}${location.hash}` }}
    />
  );
}

/**
 * Renders the public route interface.
 */
export function PublicRoute() {
  const { user, ready } = useAuth();
  if (!ready) return <LoadingScreen label="Loading CartoGraph" />;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

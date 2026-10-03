import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardByRole } from '../utils/roleRedirect';
import LoadingSpinner from '../components/forms/LoadingSpinner';

export function GuestRoute({ children }) {
  const { user, loading, role } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullPage auth />;

  if (user && location.pathname !== '/register') {
    return <Navigate to={getDashboardByRole(role)} replace />;
  }

  return children;
}

import { useMemo } from 'react';
import { Navigate } from 'react-router';
import { getCurrentUser } from '../auth';
import type { Permission } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  permission?: Permission;
}

export function ProtectedRoute({ children, requireAdmin = false, permission }: ProtectedRouteProps) {
  const user = useMemo(() => getCurrentUser(), []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const fallback = user.role === 'empleado' ? '/taller' : '/';

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to={fallback} replace />;
  }

  if (permission && user.role !== 'admin' && !user.permissions?.includes(permission)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}

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

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (permission && user.role !== 'admin' && !user.permissions?.includes(permission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

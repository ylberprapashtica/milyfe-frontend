import { ReactElement, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Props for the ProtectedRoute component
 */
export interface ProtectedRouteProps {
  /** Child component to render if authenticated */
  children: ReactNode;
}

/**
 * Protected route component
 * 
 * Wraps routes that require authentication. Redirects to login page
 * if user is not authenticated. Shows loading state while checking authentication.
 * 
 * @param {ProtectedRouteProps} props - Component props
 * @returns {ReactElement} The protected route or redirect
 * 
 * @example
 * ```tsx
 * <ProtectedRoute>
 *   <CapturesPage />
 * </ProtectedRoute>
 * ```
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps): ReactElement => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

import { ReactElement, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Props for the PublicRoute component
 */
export interface PublicRouteProps {
  /** Child component to render if not authenticated */
  children: ReactNode;
}

/**
 * Public route component
 * 
 * Wraps routes that should only be accessible when not authenticated
 * (like login and register pages). Redirects to home page if user is authenticated.
 * 
 * @param {PublicRouteProps} props - Component props
 * @returns {ReactElement} The public route or redirect
 * 
 * @example
 * ```tsx
 * <PublicRoute>
 *   <LoginPage />
 * </PublicRoute>
 * ```
 */
export const PublicRoute = ({ children }: PublicRouteProps): ReactElement => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

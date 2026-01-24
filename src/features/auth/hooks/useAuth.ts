import { useContext } from 'react';
import { AuthContext, AuthContextType } from '../AuthContext';

/**
 * Custom hook to access authentication context
 * 
 * Provides access to the current user, authentication status, and auth methods.
 * Must be used within an AuthProvider.
 * 
 * @returns {AuthContextType} Authentication context value
 * @throws {Error} If used outside of AuthProvider
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, logout } = useAuth();
 * 
 * if (isAuthenticated) {
 *   return <div>Welcome, {user.name}!</div>;
 * }
 * ```
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

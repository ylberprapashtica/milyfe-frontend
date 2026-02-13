import React, { ReactNode, ReactElement, useState, useEffect, useCallback, useRef } from 'react';
import { AuthContext, AuthContextType } from './AuthContext';
import { authService } from '@/features/auth/services/auth.service';
import { getToken } from '@/common/lib/storage';
import { User } from '@/common/types';

/**
 * Props for the AuthProvider component
 */
export interface AuthProviderProps {
  /** Child components */
  children: ReactNode;
}

/**
 * Authentication provider component
 * 
 * Manages global authentication state and provides it to child components
 * via the AuthContext. Automatically loads user data if a token exists
 * in localStorage on mount.
 * 
 * @param {AuthProviderProps} props - Component props
 * @returns {ReactElement} The provider component
 * 
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export const AuthProvider = ({ children }: AuthProviderProps): ReactElement => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  /** Prevents duplicate getCurrentUser in React Strict Mode (double mount) */
  const loadStartedRef = useRef<boolean>(false);

  /**
   * Load the current user if a token exists
   */
  const loadUser = useCallback(async (): Promise<void> => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      // Token is invalid, clear it
      authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout the current user
   */
  const logout = useCallback((): void => {
    authService.logout();
    setUser(null);
  }, []);

  // Load user on mount (once; ref prevents double call in Strict Mode)
  useEffect(() => {
    if (loadStartedRef.current) return;
    loadStartedRef.current = true;
    loadUser().catch((error) => {
      console.error('Error loading user:', error);
      setLoading(false);
    });
  }, [loadUser]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: user !== null,
    setUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

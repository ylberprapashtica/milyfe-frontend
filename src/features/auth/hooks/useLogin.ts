import { useState, useCallback } from 'react';
import { authService } from '@/features/auth/services/auth.service';
import { useAuth } from './useAuth';

/**
 * Return type for the useLogin hook
 */
export interface UseLoginReturn {
  /** Function to login with email and password */
  login: (email: string, password: string) => Promise<void>;
  /** Whether a login request is currently in progress */
  loading: boolean;
  /** Error message if login failed, null otherwise */
  error: string | null;
}

/**
 * Custom hook for user login
 * 
 * Handles user authentication and updates the global auth state.
 * 
 * @returns {UseLoginReturn} Object containing login function, loading state, and error state
 * 
 * @example
 * ```tsx
 * const { login, loading, error } = useLogin();
 * 
 * const handleSubmit = async (e: FormEvent) => {
 *   e.preventDefault();
 *   await login(email, password);
 * };
 * ```
 */
export const useLogin = (): UseLoginReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuth();

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const { user } = await authService.login(email, password);
        setUser(user);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Login failed. Please check your credentials and try again.';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setUser]
  );

  return {
    login,
    loading,
    error,
  };
};

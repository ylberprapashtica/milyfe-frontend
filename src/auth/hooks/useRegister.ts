import { useState, useCallback } from 'react';
import { authApi } from '../../services/api';
import { useAuth } from './useAuth';

/**
 * Return type for the useRegister hook
 */
export interface UseRegisterReturn {
  /** Function to register a new user */
  register: (name: string, email: string, password: string) => Promise<void>;
  /** Whether a registration request is currently in progress */
  loading: boolean;
  /** Error message if registration failed, null otherwise */
  error: string | null;
}

/**
 * Custom hook for user registration
 * 
 * Handles user registration and updates the global auth state.
 * 
 * @returns {UseRegisterReturn} Object containing register function, loading state, and error state
 * 
 * @example
 * ```tsx
 * const { register, loading, error } = useRegister();
 * 
 * const handleSubmit = async (e: FormEvent) => {
 *   e.preventDefault();
 *   await register(name, email, password);
 * };
 * ```
 */
export const useRegister = (): UseRegisterReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuth();

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const { user } = await authApi.register(name, email, password);
        setUser(user);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Registration failed. Please try again.';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setUser]
  );

  return {
    register,
    loading,
    error,
  };
};

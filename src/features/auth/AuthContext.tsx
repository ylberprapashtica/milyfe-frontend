import { createContext } from 'react';
import { User } from '@/common/types';

/**
 * Authentication context value structure
 */
export interface AuthContextType {
  /** Current authenticated user, null if not authenticated */
  user: User | null;
  /** Whether authentication state is being loaded */
  loading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Function to set the current user */
  setUser: (user: User | null) => void;
  /** Function to logout the current user */
  logout: () => void;
}

/**
 * Authentication context
 * 
 * Provides authentication state and methods throughout the application.
 * Use the useAuth hook to access this context.
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

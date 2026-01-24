import { apiClient } from '@/common/lib/api-client';
import { setToken, clearToken } from '@/common/lib/storage';
import type { User, AuthResponse } from '@/features/auth/types';

/**
 * Authentication API Service
 * 
 * Provides methods to interact with the backend authentication API endpoints.
 * All methods return Promises and handle HTTP requests via the API client.
 * 
 * @example
 * ```ts
 * import { authService } from '@/features/auth/services/auth.service';
 * 
 * // Register a new user
 * const { token, user } = await authService.register('John Doe', 'john@example.com', 'password123');
 * 
 * // Login
 * const { token, user } = await authService.login('john@example.com', 'password123');
 * 
 * // Get current user
 * const user = await authService.getCurrentUser();
 * 
 * // Logout
 * authService.logout();
 * ```
 */
export const authService = {
  /**
   * Register a new user
   * 
   * Makes a POST request to `/api/register` with user registration data.
   * The token is automatically stored in localStorage upon success.
   * 
   * @param {string} name - User's full name
   * @param {string} email - User's email address
   * @param {string} password - User's password (minimum 8 characters)
   * @returns {Promise<AuthResponse>} Promise that resolves to token and user data
   * @throws {Error} If the API request fails or validation fails (422)
   * 
   * @example
   * ```ts
   * const { token, user } = await authService.register('John Doe', 'john@example.com', 'password123');
   * console.log(`Registered user: ${user.name}`);
   * ```
   */
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/register', {
      name,
      email,
      password,
    });
    setToken(response.data.token);
    return response.data;
  },

  /**
   * Login with email and password
   * 
   * Makes a POST request to `/api/login` with credentials.
   * The token is automatically stored in localStorage upon success.
   * 
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<AuthResponse>} Promise that resolves to token and user data
   * @throws {Error} If the API request fails or credentials are invalid (422)
   * 
   * @example
   * ```ts
   * const { token, user } = await authService.login('john@example.com', 'password123');
   * console.log(`Logged in as: ${user.name}`);
   * ```
   */
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/login', {
      email,
      password,
    });
    setToken(response.data.token);
    return response.data;
  },

  /**
   * Get the current authenticated user
   * 
   * Makes a GET request to `/api/user` to retrieve the current user's data.
   * Requires authentication token in the request header.
   * 
   * @returns {Promise<User>} Promise that resolves to the current user data
   * @throws {Error} If the API request fails or user is not authenticated (401)
   * 
   * @example
   * ```ts
   * const user = await authService.getCurrentUser();
   * console.log(`Current user: ${user.name}`);
   * ```
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/user');
    return response.data;
  },

  /**
   * Logout the current user
   * 
   * Clears the authentication token from localStorage.
   * This does not make an API call - it only clears local storage.
   * 
   * @example
   * ```ts
   * authService.logout();
   * // User is now logged out
   * ```
   */
  logout: (): void => {
    clearToken();
  },
};

import { TOKEN_STORAGE_KEY } from '../config';

/**
 * Token storage utilities
 * 
 * Provides methods to manage authentication tokens in localStorage.
 */

/**
 * Get the stored authentication token
 * 
 * @returns {string | null} The stored token or null if not found
 * 
 * @example
 * ```ts
 * const token = getToken();
 * if (token) {
 *   // User is authenticated
 * }
 * ```
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

/**
 * Store the authentication token
 * 
 * @param {string} token - The authentication token to store
 * 
 * @example
 * ```ts
 * setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 * ```
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

/**
 * Clear the authentication token
 * 
 * @example
 * ```ts
 * clearToken();
 * // User is now logged out
 * ```
 */
export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

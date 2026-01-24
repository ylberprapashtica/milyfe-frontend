/**
 * Application configuration
 * 
 * Centralized configuration for the application including API URLs and constants.
 */

/**
 * Base URL for the API
 * Defaults to localhost:8080 if REACT_APP_API_URL is not set
 */
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

/**
 * Local storage key for authentication token
 */
export const TOKEN_STORAGE_KEY = 'auth_token';

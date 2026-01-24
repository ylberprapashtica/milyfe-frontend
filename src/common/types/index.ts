/**
 * Common types shared across features
 * 
 * This module contains type definitions used by multiple features
 * throughout the application.
 */

/**
 * User data structure
 * 
 * Represents a user in the system
 */
export interface User {
  /** Unique identifier for the user */
  id: number;
  /** User's full name */
  name: string;
  /** User's email address */
  email: string;
  /** ISO 8601 timestamp when the user was created */
  created_at: string;
  /** ISO 8601 timestamp when the user was last updated */
  updated_at: string;
}

/**
 * Authentication response structure
 * 
 * Returned from login and registration endpoints
 */
export interface AuthResponse {
  /** Authentication token */
  token: string;
  /** User data */
  user: User;
}

import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getToken, clearToken } from './storage';

/**
 * Axios API client instance
 * 
 * Pre-configured axios instance with:
 * - Base URL from environment config
 * - JSON content-type header
 * - Request interceptor to add auth token
 * - Response interceptor to handle 401 errors
 * 
 * @example
 * ```ts
 * import { apiClient } from '@/common/lib/api-client';
 * 
 * const response = await apiClient.get('/captures');
 * ```
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to add authentication token
 * 
 * Automatically adds the Bearer token to all requests if available
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle authentication errors
 * 
 * Automatically clears token and redirects on 401 (Unauthorized) responses
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
    }
    return Promise.reject(error);
  }
);

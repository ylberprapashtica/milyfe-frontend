import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const TOKEN_STORAGE_KEY = 'auth_token';

/**
 * Get the stored authentication token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

/**
 * Store the authentication token
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

/**
 * Clear the authentication token
 */
export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
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

// Handle 401 responses by clearing token
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
    }
    return Promise.reject(error);
  }
);

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
 */
export interface AuthResponse {
  /** Authentication token */
  token: string;
  /** User data */
  user: User;
}

/**
 * Capture data structure
 * 
 * Represents a single capture with its metadata
 */
export interface Capture {
  /** Unique identifier for the capture */
  id: number;
  /** The main content text */
  content: string;
  /** The title of the capture (optional, auto-extracted from first line if empty) */
  title: string;
  /** URL-friendly slug identifier */
  slug: string;
  /** Array of tags for categorization */
  tags: string[];
  /** ISO 8601 timestamp when the capture was created */
  created_at: string;
  /** ISO 8601 timestamp when the capture was last updated */
  updated_at: string;
  /** Notes that this note links to (optional, loaded with relationships) */
  links_to?: Capture[];
  /** Notes that link to this note (optional, loaded with relationships) */
  linked_from?: Capture[];
}

/**
 * Graph data structure for visualization
 */
export interface GraphData {
  /** Array of nodes (notes) */
  nodes: Array<{
    id: string;
    data: {
      label: string;
      tags: string[];
      captureId: number;
      slug: string;
    };
    position: {
      x: number;
      y: number;
    };
  }>;
  /** Array of edges (links between notes) */
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

/**
 * API client for capture operations
 * 
 * Provides methods to interact with the backend capture API endpoints.
 * All methods return Promises and handle HTTP requests via axios.
 * 
 * @example
 * ```ts
 * // Get all captures
 * const captures = await capturesApi.getCaptures();
 * 
 * // Create a new capture
 * const newCapture = await capturesApi.createCapture('My thought');
 * 
 * // Update a capture
 * const updated = await capturesApi.updateCapture(1, 'Updated thought');
 * 
 * // Delete a capture
 * await capturesApi.deleteCapture(1);
 * ```
 */
export const capturesApi = {
  /**
   * Fetch all captures from the API
   * 
   * Makes a GET request to `/api/captures` and returns all captures.
   * 
   * @returns {Promise<Capture[]>} Promise that resolves to an array of all captures
   * @throws {Error} If the API request fails
   * 
   * @example
   * ```ts
   * const captures = await capturesApi.getCaptures();
   * console.log(`Found ${captures.length} captures`);
   * ```
   */
  getCaptures: async (): Promise<Capture[]> => {
    const response = await apiClient.get<Capture[]>('/captures');
    return response.data;
  },

  /**
   * Fetch a single capture by ID
   * 
   * Makes a GET request to `/api/captures/{id}` and returns the capture with the specified ID.
   * 
   * @param {number} id - The unique identifier of the capture to fetch
   * @returns {Promise<Capture>} Promise that resolves to the capture data
   * @throws {Error} If the API request fails or capture is not found (404)
   * 
   * @example
   * ```ts
   * const capture = await capturesApi.getCapture(1);
   * console.log(capture.thought);
   * ```
   */
  getCapture: async (id: number): Promise<Capture> => {
    const response = await apiClient.get<Capture>(`/captures/${id}`);
    return response.data;
  },

  /**
   * Create a new capture
   * 
   * Makes a POST request to `/api/captures` with the content and optional title/tags.
   * The API will assign an ID, generate a slug, and set timestamps automatically.
   * 
   * @param {string} content - The main content text
   * @param {string} [title] - Optional title (auto-extracted from first line if not provided)
   * @param {string[]} [tags] - Optional array of tags
   * @returns {Promise<Capture>} Promise that resolves to the newly created capture
   * @throws {Error} If the API request fails or validation fails (422)
   * 
   * @example
   * ```ts
   * const newCapture = await capturesApi.createCapture('My new thought', 'My Title', ['tag1', 'tag2']);
   * console.log(`Created capture with ID: ${newCapture.id}`);
   * ```
   */
  createCapture: async (content: string, title?: string, tags?: string[]): Promise<Capture> => {
    const response = await apiClient.post<Capture>('/captures', { content, title, tags });
    return response.data;
  },

  /**
   * Update an existing capture
   * 
   * Makes a PUT request to `/api/captures/{id}` to update the content, title, and tags.
   * The updated_at timestamp will be automatically updated by the server.
   * Links will be automatically parsed and synced from the content.
   * 
   * @param {number} id - The unique identifier of the capture to update
   * @param {string} content - The new content text
   * @param {string} [title] - Optional title (auto-extracted from first line if not provided)
   * @param {string[]} [tags] - Optional array of tags
   * @returns {Promise<Capture>} Promise that resolves to the updated capture
   * @throws {Error} If the API request fails, capture is not found (404), or validation fails (422)
   * 
   * @example
   * ```ts
   * const updated = await capturesApi.updateCapture(1, 'Updated content', 'New Title', ['tag1']);
   * console.log(`Updated at: ${updated.updated_at}`);
   * ```
   */
  updateCapture: async (id: number, content: string, title?: string, tags?: string[]): Promise<Capture> => {
    const response = await apiClient.put<Capture>(`/captures/${id}`, { content, title, tags });
    return response.data;
  },

  /**
   * Delete a capture
   * 
   * Makes a DELETE request to `/api/captures/{id}` to permanently delete the capture.
   * 
   * @param {number} id - The unique identifier of the capture to delete
   * @returns {Promise<void>} Promise that resolves when the deletion is complete
   * @throws {Error} If the API request fails or capture is not found (404)
   * 
   * @example
   * ```ts
   * await capturesApi.deleteCapture(1);
   * console.log('Capture deleted successfully');
   * ```
   */
  deleteCapture: async (id: number): Promise<void> => {
    await apiClient.delete(`/captures/${id}`);
  },

  /**
   * Search captures by query
   * 
   * Makes a GET request to `/api/captures/search?q={query}` to search across titles and content.
   * 
   * @param {string} query - The search query string
   * @returns {Promise<Capture[]>} Promise that resolves to an array of matching captures
   * @throws {Error} If the API request fails
   * 
   * @example
   * ```ts
   * const results = await capturesApi.searchCaptures('keyword');
   * console.log(`Found ${results.length} matches`);
   * ```
   */
  searchCaptures: async (query: string): Promise<Capture[]> => {
    const response = await apiClient.get<Capture[]>('/captures/search', {
      params: { q: query },
    });
    return response.data;
  },

  /**
   * Get linked notes for a capture
   * 
   * Makes a GET request to `/api/captures/{id}/links` to get all notes linked from this capture.
   * 
   * @param {number} id - The unique identifier of the capture
   * @returns {Promise<Capture[]>} Promise that resolves to an array of linked captures
   * @throws {Error} If the API request fails or capture is not found (404)
   * 
   * @example
   * ```ts
   * const links = await capturesApi.getCaptureLinks(1);
   * console.log(`This note links to ${links.length} other notes`);
   * ```
   */
  getCaptureLinks: async (id: number): Promise<Capture[]> => {
    const response = await apiClient.get<Capture[]>(`/captures/${id}/links`);
    return response.data;
  },

  /**
   * Get graph data for visualization
   * 
   * Makes a GET request to `/api/captures/graph` to get all notes and links formatted for graph visualization.
   * 
   * @returns {Promise<GraphData>} Promise that resolves to graph data with nodes and edges
   * @throws {Error} If the API request fails
   * 
   * @example
   * ```ts
   * const graphData = await capturesApi.getGraphData();
   * console.log(`Graph has ${graphData.nodes.length} nodes and ${graphData.edges.length} edges`);
   * ```
   */
  getGraphData: async (): Promise<GraphData> => {
    const response = await apiClient.get<GraphData>('/captures/graph');
    return response.data;
  },

  /**
   * Update the graph position of a capture
   * 
   * Makes a PUT request to `/api/captures/{id}/position` to update the x and y coordinates
   * of a capture in the graph view.
   * 
   * @param {number} id - The unique identifier of the capture
   * @param {number} x - The x coordinate position
   * @param {number} y - The y coordinate position
   * @returns {Promise<void>} Promise that resolves when the position is updated
   * @throws {Error} If the API request fails or capture is not found (404)
   * 
   * @example
   * ```ts
   * await capturesApi.updateCapturePosition(1, 100, 200);
   * console.log('Position updated');
   * ```
   */
  updateCapturePosition: async (id: number, x: number, y: number): Promise<void> => {
    await apiClient.put(`/captures/${id}/position`, { x, y });
  },
};

/**
 * API client for authentication operations
 * 
 * Provides methods to interact with the backend authentication API endpoints.
 * All methods return Promises and handle HTTP requests via axios.
 * 
 * @example
 * ```ts
 * // Register a new user
 * const { token, user } = await authApi.register('John Doe', 'john@example.com', 'password123');
 * 
 * // Login
 * const { token, user } = await authApi.login('john@example.com', 'password123');
 * 
 * // Get current user
 * const user = await authApi.getCurrentUser();
 * 
 * // Logout
 * authApi.logout();
 * ```
 */
export const authApi = {
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
   * const { token, user } = await authApi.register('John Doe', 'john@example.com', 'password123');
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
   * const { token, user } = await authApi.login('john@example.com', 'password123');
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
   * const user = await authApi.getCurrentUser();
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
   * authApi.logout();
   * // User is now logged out
   * ```
   */
  logout: (): void => {
    clearToken();
  },
};

import { apiClient } from '@/common/lib/api-client';
import type { Capture, CaptureStatus, CaptureType, GraphData } from '@/features/captures/types';

/**
 * Captures API Service
 * 
 * Provides methods to interact with the backend capture API endpoints.
 * All methods return Promises and handle HTTP requests via the API client.
 * 
 * @example
 * ```ts
 * import { capturesService } from '@/features/captures/services/captures.service';
 * 
 * // Get all captures
 * const captures = await capturesService.getCaptures();
 * 
 * // Create a new capture
 * const newCapture = await capturesService.createCapture('My thought');
 * 
 * // Update a capture
 * const updated = await capturesService.updateCapture(1, 'Updated thought');
 * 
 * // Delete a capture
 * await capturesService.deleteCapture(1);
 * ```
 */
export const capturesService = {
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
   * const captures = await capturesService.getCaptures();
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
   * const capture = await capturesService.getCapture(1);
   * console.log(capture.content);
   * ```
   */
  getCapture: async (id: number): Promise<Capture> => {
    const response = await apiClient.get<Capture>(`/captures/${id}`);
    return response.data;
  },

  /**
   * Get all available capture types
   * 
   * Makes a GET request to `/api/captures/types` and returns all available capture types.
   * 
   * @returns {Promise<CaptureType[]>} Promise that resolves to an array of all capture types
   * @throws {Error} If the API request fails
   * 
   * @example
   * ```ts
   * const types = await capturesService.getCaptureTypes();
   * console.log(`Found ${types.length} capture types`);
   * ```
   */
  getCaptureTypes: async (): Promise<CaptureType[]> => {
    const response = await apiClient.get<CaptureType[]>('/captures/types');
    return response.data;
  },

  /**
   * Get all available capture statuses
   * 
   * Makes a GET request to `/api/captures/statuses` and returns all available capture statuses.
   * 
   * @returns {Promise<CaptureStatus[]>} Promise that resolves to an array of all capture statuses
   * @throws {Error} If the API request fails
   * 
   * @example
   * ```ts
   * const statuses = await capturesService.getCaptureStatuses();
   * console.log(`Found ${statuses.length} capture statuses`);
   * ```
   */
  getCaptureStatuses: async (): Promise<CaptureStatus[]> => {
    const response = await apiClient.get<CaptureStatus[]>('/captures/statuses');
    return response.data;
  },

  /**
   * Create a new capture
   * 
   * Makes a POST request to `/api/captures` with the content and optional title/tags/type/status.
   * The API will assign an ID, generate a slug, and set timestamps automatically.
   * 
   * @param {string} content - The main content text
   * @param {string} [title] - Optional title (auto-extracted from first line if not provided)
   * @param {string[]} [tags] - Optional array of tags
   * @param {number} [capture_type_id] - Optional capture type ID
   * @param {number} [capture_status_id] - Optional capture status ID
   * @returns {Promise<Capture>} Promise that resolves to the newly created capture
   * @throws {Error} If the API request fails or validation fails (422)
   * 
   * @example
   * ```ts
   * const newCapture = await capturesService.createCapture('My new thought', 'My Title', ['tag1', 'tag2'], 1, 2);
   * console.log(`Created capture with ID: ${newCapture.id}`);
   * ```
   */
  createCapture: async (
    content: string,
    title?: string,
    tags?: string[],
    capture_type_id?: number | null,
    capture_status_id?: number | null,
    sketch_image?: string | null,
    voice_audio?: string | null,
    graph_x?: number,
    graph_y?: number
  ): Promise<Capture> => {
    const body: Record<string, unknown> = { content, title, tags, capture_type_id, capture_status_id, sketch_image, voice_audio };
    if (graph_x !== undefined && graph_y !== undefined) {
      body.graph_x = graph_x;
      body.graph_y = graph_y;
    }
    const response = await apiClient.post<Capture>('/captures', body);
    return response.data;
  },

  /**
   * Update an existing capture
   * 
   * Makes a PUT request to `/api/captures/{id}` to update the content, title, tags, type, and status.
   * The updated_at timestamp will be automatically updated by the server.
   * Links will be automatically parsed and synced from the content.
   * 
   * @param {number} id - The unique identifier of the capture to update
   * @param {string} content - The new content text
   * @param {string} [title] - Optional title (auto-extracted from first line if not provided)
   * @param {string[]} [tags] - Optional array of tags
   * @param {number} [capture_type_id] - Optional capture type ID
   * @param {number} [capture_status_id] - Optional capture status ID
   * @returns {Promise<Capture>} Promise that resolves to the updated capture
   * @throws {Error} If the API request fails, capture is not found (404), or validation fails (422)
   * 
   * @example
   * ```ts
   * const updated = await capturesService.updateCapture(1, 'Updated content', 'New Title', ['tag1'], 2, 3);
   * console.log(`Updated at: ${updated.updated_at}`);
   * ```
   */
  updateCapture: async (id: number, content: string, title?: string, tags?: string[], capture_type_id?: number | null, capture_status_id?: number | null, sketch_image?: string | null, voice_audio?: string | null): Promise<Capture> => {
    const response = await apiClient.put<Capture>(`/captures/${id}`, { content, title, tags, capture_type_id, capture_status_id, sketch_image, voice_audio });
    return response.data;
  },

  /**
   * Update only the status of a capture
   * 
   * Makes a PUT request to `/api/captures/{id}` to update only the status field.
   * This is a convenience method for changing status without updating other fields.
   * 
   * @param {number} id - The unique identifier of the capture
   * @param {number} capture_status_id - The new status ID
   * @returns {Promise<Capture>} Promise that resolves to the updated capture
   * @throws {Error} If the API request fails, capture is not found (404), or validation fails (422)
   * 
   * @example
   * ```ts
   * const updated = await capturesService.updateCaptureStatus(1, 2);
   * console.log(`Status updated to: ${updated.capture_status?.name}`);
   * ```
   */
  updateCaptureStatus: async (id: number, capture_status_id: number): Promise<Capture> => {
    // First get the current capture to preserve other fields
    const current = await capturesService.getCapture(id);
    return capturesService.updateCapture(id, current.content, current.title, current.tags, current.capture_type_id, capture_status_id, current.sketch_image, current.voice_audio);
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
   * await capturesService.deleteCapture(1);
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
   * const results = await capturesService.searchCaptures('keyword');
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
   * const links = await capturesService.getCaptureLinks(1);
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
   * const graphData = await capturesService.getGraphData();
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
   * await capturesService.updateCapturePosition(1, 100, 200);
   * console.log('Position updated');
   * ```
   */
  updateCapturePosition: async (id: number, x: number, y: number): Promise<void> => {
    await apiClient.put(`/captures/${id}/position`, { x, y });
  },

  /**
   * Create a link between two captures
   * 
   * Makes a POST request to `/api/captures/links` to create a directional link
   * from source capture to target capture. The source capture's content will be
   * automatically updated to include [[Target Title]] if not already present.
   * 
   * @param {number} sourceId - The ID of the source capture
   * @param {number} targetId - The ID of the target capture
   * @returns {Promise<{link: {id: number, source_capture_id: number, target_capture_id: number}, source_capture: Capture}>} Promise that resolves with the created link data and updated source capture
   * @throws {Error} If the API request fails, captures not found, or validation fails
   * 
   * @example
   * ```ts
   * const result = await capturesService.createLink(1, 2);
   * console.log(`Created link with ID: ${result.link.id}`);
   * console.log(`Source capture updated: ${result.source_capture.content}`);
   * ```
   */
  createLink: async (sourceId: number, targetId: number): Promise<{link: {id: number, source_capture_id: number, target_capture_id: number}, source_capture: Capture}> => {
    const response = await apiClient.post<{link: {id: number, source_capture_id: number, target_capture_id: number}, source_capture: Capture}>('/captures/links', {
      source_capture_id: sourceId,
      target_capture_id: targetId,
    });
    return response.data;
  },

  /**
   * Delete a link between two captures
   * 
   * Makes a DELETE request to `/api/captures/links/{linkId}` to remove a link.
   * 
   * @param {number} linkId - The unique identifier of the link to delete
   * @returns {Promise<void>} Promise that resolves when the link is deleted
   * @throws {Error} If the API request fails or link is not found (404)
   * 
   * @example
   * ```ts
   * await capturesService.deleteLink(5);
   * console.log('Link deleted');
   * ```
   */
  deleteLink: async (linkId: number): Promise<void> => {
    await apiClient.delete(`/captures/links/${linkId}`);
  },
};

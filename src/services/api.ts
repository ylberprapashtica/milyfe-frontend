import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Capture {
  id: number;
  thought: string;
  created_at: string;
  updated_at: string;
}

export const capturesApi = {
  /**
   * Fetch all captures
   */
  getCaptures: async (): Promise<Capture[]> => {
    const response = await apiClient.get<Capture[]>('/captures');
    return response.data;
  },

  /**
   * Fetch a single capture by ID
   */
  getCapture: async (id: number): Promise<Capture> => {
    const response = await apiClient.get<Capture>(`/captures/${id}`);
    return response.data;
  },

  /**
   * Create a new capture
   */
  createCapture: async (thought: string): Promise<Capture> => {
    const response = await apiClient.post<Capture>('/captures', { thought });
    return response.data;
  },

  /**
   * Update an existing capture
   */
  updateCapture: async (id: number, thought: string): Promise<Capture> => {
    const response = await apiClient.put<Capture>(`/captures/${id}`, { thought });
    return response.data;
  },

  /**
   * Delete a capture
   */
  deleteCapture: async (id: number): Promise<void> => {
    await apiClient.delete(`/captures/${id}`);
  },
};


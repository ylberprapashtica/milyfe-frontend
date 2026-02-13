import { apiClient } from '@/common/lib/api-client';
import type { Project } from '@/features/projects/types';

export const projectsService = {
  getProjects: async (): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>('/projects');
    return response.data;
  },

  createProject: async (name: string, description?: string | null): Promise<Project> => {
    const response = await apiClient.post<Project>('/projects', { name, description });
    return response.data;
  },

  updateProject: async (id: number, name?: string, description?: string | null): Promise<Project> => {
    const response = await apiClient.put<Project>(`/projects/${id}`, { name, description });
    return response.data;
  },

  deleteProject: async (id: number): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  /**
   * Update the graph layout (position and dimensions) of a project.
   */
  updateProjectLayout: async (
    id: number,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<Project> => {
    const response = await apiClient.put<Project>(`/projects/${id}/layout`, {
      x,
      y,
      width,
      height,
    });
    return response.data;
  },

  /**
   * Update graph layouts for multiple projects in one request.
   * layouts: { [projectId: string]: { x, y, width, height } }
   */
  updateProjectLayouts: async (
    layouts: Record<string, { x: number; y: number; width: number; height: number }>
  ): Promise<Project[]> => {
    const response = await apiClient.put<Project[]>('/projects/layouts', { layouts });
    return response.data;
  },
};

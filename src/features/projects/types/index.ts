/**
 * Project types
 */

export interface Project {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  /** Graph view position and dimensions (optional, from DB) */
  graph_x?: number | null;
  graph_y?: number | null;
  graph_width?: number | null;
  graph_height?: number | null;
}

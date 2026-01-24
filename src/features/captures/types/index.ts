/**
 * Capture types
 * 
 * Type definitions for the captures feature.
 */

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

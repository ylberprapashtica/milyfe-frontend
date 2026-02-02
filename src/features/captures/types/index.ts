/**
 * Capture types
 * 
 * Type definitions for the captures feature.
 */

/**
 * Capture type data structure
 */
export interface CaptureType {
  /** Unique identifier for the capture type */
  id: number;
  /** Name of the type (e.g., "memory", "describing", "action", "planning", "dreaming") */
  name: string;
  /** Symbol representation of the type (e.g., "<<", "<", "0", ">", ">>") */
  symbol: string;
  /** ISO 8601 timestamp when the type was created */
  created_at: string;
  /** ISO 8601 timestamp when the type was last updated */
  updated_at: string;
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
  /** ID of the capture type (optional) */
  capture_type_id?: number | null;
  /** Capture type relationship (optional, loaded with relationships) */
  capture_type?: CaptureType | null;
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
      content?: string;
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
    /** Database ID of the note_links record (optional for new edges) */
    linkId?: number;
  }>;
}

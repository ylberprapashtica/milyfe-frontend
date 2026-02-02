import { useState, useCallback } from 'react';
import { capturesService } from '@/features/captures/services/captures.service';

/**
 * Return type for the useCapture hook
 */
export interface UseCaptureReturn {
  /** Whether a request is currently in progress */
  loading: boolean;
  /** Error message if a request failed, null otherwise */
  error: string | null;
  /** Function to update a capture */
  updateCapture: (id: number, content: string, title?: string, tags?: string[], capture_type_id?: number | null) => Promise<void>;
  /** Function to delete a capture */
  deleteCapture: (id: number) => Promise<void>;
}

/**
 * Custom hook for managing individual capture operations
 * 
 * Handles updating and deleting a single capture, managing loading/error states.
 * 
 * @returns {UseCaptureReturn} Object containing loading state, error state, and update/delete functions
 * 
 * @example
 * ```tsx
 * const { loading, error, updateCapture, deleteCapture } = useCapture();
 * 
 * const handleUpdate = async () => {
 *   try {
 *     await updateCapture(1, 'Updated thought');
 *     // Handle success
 *   } catch (err) {
 *     // Handle error
 *   }
 * };
 * 
 * const handleDelete = async () => {
 *   if (window.confirm('Are you sure?')) {
 *     await deleteCapture(1);
 *   }
 * };
 * ```
 */
export const useCapture = (): UseCaptureReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Update an existing capture
   * 
   * @param {number} id - The ID of the capture to update
   * @param {string} content - The new content text
   * @param {string} [title] - Optional title
   * @param {string[]} [tags] - Optional array of tags
   * @param {number} [capture_type_id] - Optional capture type ID
   * @throws {Error} If the update fails
   */
  const updateCapture = useCallback(async (
    id: number,
    content: string,
    title?: string,
    tags?: string[],
    capture_type_id?: number | null
  ): Promise<void> => {
    if (!content.trim()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await capturesService.updateCapture(id, content.trim(), title, tags, capture_type_id);
    } catch (err) {
      setError('Failed to update capture. Please try again.');
      console.error('Error updating capture:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a capture
   * 
   * @param {number} id - The ID of the capture to delete
   * @throws {Error} If the deletion fails
   */
  const deleteCapture = useCallback(async (id: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await capturesService.deleteCapture(id);
    } catch (err) {
      setError('Failed to delete capture. Please try again.');
      console.error('Error deleting capture:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    updateCapture,
    deleteCapture,
  };
};


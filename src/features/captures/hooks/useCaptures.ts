import { useState, useEffect, useCallback } from 'react';
import { capturesService } from '@/features/captures/services/captures.service';
import { Capture } from '@/features/captures/types';

/**
 * Return type for the useCaptures hook
 */
export interface UseCapturesReturn {
  /** Array of all captures */
  captures: Capture[];
  /** Whether a request is currently in progress */
  loading: boolean;
  /** Error message if a request failed, null otherwise */
  error: string | null;
  /** Function to reload all captures from the API */
  reload: () => Promise<void>;
  /** Function to create a new capture */
  createCapture: (content: string, title?: string, tags?: string[], capture_type_id?: number | null, capture_status_id?: number | null) => Promise<void>;
}

/**
 * Custom hook for managing the list of captures
 * 
 * Handles fetching all captures, creating new captures, and managing loading/error states.
 * 
 * @returns {UseCapturesReturn} Object containing captures array, loading state, error state, and CRUD functions
 * 
 * @example
 * ```tsx
 * const { captures, loading, error, createCapture, reload } = useCaptures();
 * 
 * useEffect(() => {
 *   // Captures are automatically loaded on mount
 * }, []);
 * 
 * const handleCreate = async () => {
 *   await createCapture('My new thought');
 *   // List will automatically refresh
 * };
 * ```
 */
export const useCaptures = (): UseCapturesReturn => {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all captures from the API
   */
  const loadCaptures = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await capturesService.getCaptures();
      setCaptures(data);
    } catch (err) {
      setError('Failed to load captures. Please try again.');
      console.error('Error loading captures:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new capture and refresh the list
   */
  const createCapture = useCallback(async (
    content: string,
    title?: string,
    tags?: string[],
    capture_type_id?: number | null,
    capture_status_id?: number | null
  ): Promise<void> => {
    if (!content.trim()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await capturesService.createCapture(content.trim(), title, tags, capture_type_id, capture_status_id);
      await loadCaptures();
    } catch (err) {
      setError('Failed to save capture. Please try again.');
      console.error('Error creating capture:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadCaptures]);

  // Load captures on mount
  useEffect(() => {
    loadCaptures();
  }, [loadCaptures]);

  return {
    captures,
    loading,
    error,
    reload: loadCaptures,
    createCapture,
  };
};


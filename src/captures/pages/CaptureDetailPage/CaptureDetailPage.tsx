import { useEffect, useState, ReactElement } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { capturesApi, Capture } from '../../../services/api';
import { CaptureItem } from '../../components/CaptureItem';
import { useCapture } from '../../hooks/useCapture';
import './CaptureDetailPage.scss';

/**
 * Detail page component for viewing and editing a single capture
 * 
 * This page displays a single capture in detail and allows editing.
 * It fetches the capture by ID from the URL parameters and provides
 * a detailed view with edit capabilities.
 * 
 * @returns {ReactElement} The rendered capture detail page
 * 
 * @example
 * ```tsx
 * // Used in routing
 * <Route path="/captures/:id" element={<CaptureDetailPage />} />
 * ```
 */
export const CaptureDetailPage = (): ReactElement => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [capture, setCapture] = useState<Capture | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { loading: updateLoading, updateCapture, deleteCapture } = useCapture();

  /**
   * Load the capture by ID
   */
  useEffect(() => {
    const loadCapture = async (): Promise<void> => {
      if (!id) {
        setError('Invalid capture ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await capturesApi.getCapture(Number(id));
        setCapture(data);
      } catch (err) {
        setError('Failed to load capture. Please try again.');
        console.error('Error loading capture:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCapture();
  }, [id]);

  /**
   * Handle capture update
   */
  const handleUpdate = async (captureId: number, thought: string): Promise<void> => {
    await updateCapture(captureId, thought);
    // Reload the capture to get updated data
    if (id) {
      try {
        const updated = await capturesApi.getCapture(Number(id));
        setCapture(updated);
      } catch (err) {
        console.error('Error reloading capture:', err);
      }
    }
  };

  /**
   * Handle capture deletion
   */
  const handleDelete = async (captureId: number): Promise<void> => {
    await deleteCapture(captureId);
    // Navigate back to the list after deletion
    navigate('/');
  };

  if (loading) {
    return (
      <div className="capture-detail-page">
        <div className="capture-detail-page-container">
          <div className="capture-detail-loading">Loading capture...</div>
        </div>
      </div>
    );
  }

  if (error || !capture) {
    return (
      <div className="capture-detail-page">
        <div className="capture-detail-page-container">
          <div className="capture-detail-error" role="alert">
            {error || 'Capture not found'}
          </div>
          <button
            className="capture-detail-back-button"
            onClick={() => navigate('/')}
          >
            Back to Captures
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="capture-detail-page">
      <div className="capture-detail-page-container">
        <button
          className="capture-detail-back-button"
          onClick={() => navigate('/')}
        >
          ← Back to Captures
        </button>
        <h1 className="capture-detail-title">Capture Details</h1>
        <CaptureItem
          capture={capture}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          disabled={updateLoading}
        />
      </div>
    </div>
  );
};


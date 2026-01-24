import { useEffect, useState, ReactElement } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { capturesService } from '@/features/captures/services/captures.service';
import { Capture } from '@/features/captures/types';
import { useCapture } from '@/features/captures/hooks/useCapture';
import { CaptureInput } from '@/features/captures/components/CaptureInput';
import { CaptureForm } from '@/features/captures/components/CaptureForm';
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { loading: updateLoading, error: updateError, updateCapture, deleteCapture } = useCapture();

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
        const data = await capturesService.getCapture(Number(id));
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
  const handleUpdate = async (
    content: string,
    title?: string,
    tags?: string[]
  ): Promise<void> => {
    if (!capture) return;
    
    try {
      await updateCapture(capture.id, content, title, tags);
      // Reload the capture to get updated data
      if (id) {
        try {
          const updated = await capturesService.getCapture(Number(id));
          setCapture(updated);
          // Show success message
          setSuccessMessage('Note updated successfully!');
          // Clear success message after 3 seconds
          setTimeout(() => {
            setSuccessMessage(null);
          }, 3000);
        } catch (err) {
          console.error('Error reloading capture:', err);
        }
      }
    } catch (err) {
      // Error handling is done by CaptureForm via error prop
      console.error('Error updating note:', err);
    }
  };

  if (loading) {
    return (
      <div className="create-note-page">
        <div className="create-note-page-container">
          <div className="capture-detail-loading">Loading capture...</div>
        </div>
      </div>
    );
  }

  if (error || !capture) {
    return (
      <div className="create-note-page">
        <div className="create-note-page-container">
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
    <div className="create-note-page">
      <div className="create-note-page-container">
        <div className="create-note-page-header">
          <h1 className="create-note-page-title">Edit Note</h1>
          <Link to="/slipbox" className="create-note-page-link">
            View Slipbox →
          </Link>
        </div>

        {successMessage && (
          <div className="create-note-page-success" role="alert">
            {successMessage}
          </div>
        )}

        <div className="create-note-page-form">
          <CaptureForm error={updateError || error}>
            <CaptureInput
              onSubmit={handleUpdate}
              disabled={updateLoading}
              placeholder="Write your note here. Use [[double brackets]] to link to other notes..."
              initialTitle={capture.title || ''}
              initialContent={capture.content}
              initialTags={capture.tags?.join(', ') || ''}
              submitButtonText="Update Note"
            />
          </CaptureForm>
        </div>
      </div>
    </div>
  );
};


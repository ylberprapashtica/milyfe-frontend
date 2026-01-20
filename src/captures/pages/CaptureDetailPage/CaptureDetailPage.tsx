import { useEffect, useState, ReactElement } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { capturesApi, Capture } from '../../../services/api';
import { useCapture } from '../../hooks/useCapture';
import { renderLinks } from '../../utils/linkParser';
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
  const handleUpdate = async (
    captureId: number,
    content: string,
    title?: string,
    tags?: string[]
  ): Promise<void> => {
    await updateCapture(captureId, content, title, tags);
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
   * Handle link click - navigate to the linked note
   */
  const handleLinkClick = (linkTitle: string): void => {
    // Try to find the note by searching for it
    // In a full implementation, we'd search by slug
    navigate(`/?search=${encodeURIComponent(linkTitle)}`);
  };

  /**
   * Handle capture deletion
   */
  const handleDelete = async (): Promise<void> => {
    if (!id) return;
    await deleteCapture(Number(id));
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

  const displayTitle = capture.title || capture.content.split('\n')[0]?.substring(0, 100) || 'Untitled';

  return (
    <div className="capture-detail-page">
      <div className="capture-detail-page-container">
        <button
          className="capture-detail-back-button"
          onClick={() => navigate('/')}
        >
          ← Back to Notes
        </button>

        <div className="capture-detail-content">
          <div className="capture-detail-main">
            <h1 className="capture-detail-title">{displayTitle}</h1>

            {capture.tags && capture.tags.length > 0 && (
              <div className="capture-detail-tags">
                {capture.tags.map((tag, index) => (
                  <span key={index} className="capture-detail-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="capture-detail-text">
              {renderLinks(capture.content, handleLinkClick)}
            </div>

            <div className="capture-detail-meta">
              <span className="capture-detail-date">
                Created: {new Date(capture.created_at).toLocaleString()}
              </span>
              {capture.updated_at !== capture.created_at && (
                <span className="capture-detail-date">
                  Updated: {new Date(capture.updated_at).toLocaleString()}
                </span>
              )}
            </div>

            <div className="capture-detail-actions">
              <button
                className="capture-detail-button capture-detail-button-delete"
                onClick={handleDelete}
          disabled={updateLoading}
              >
                Delete Note
              </button>
            </div>
          </div>

          <div className="capture-detail-sidebar">
            {capture.links_to && capture.links_to.length > 0 && (
              <div className="capture-detail-section">
                <h3 className="capture-detail-section-title">Links to</h3>
                <ul className="capture-detail-links-list">
                  {capture.links_to.map((linkedNote) => (
                    <li key={linkedNote.id}>
                      <button
                        className="capture-detail-link"
                        onClick={() => navigate(`/captures/${linkedNote.id}`)}
                      >
                        {linkedNote.title || linkedNote.slug}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {capture.linked_from && capture.linked_from.length > 0 && (
              <div className="capture-detail-section">
                <h3 className="capture-detail-section-title">Backlinks</h3>
                <ul className="capture-detail-links-list">
                  {capture.linked_from.map((backlinkNote) => (
                    <li key={backlinkNote.id}>
                      <button
                        className="capture-detail-link"
                        onClick={() => navigate(`/captures/${backlinkNote.id}`)}
                      >
                        {backlinkNote.title || backlinkNote.slug}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


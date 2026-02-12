import { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capture } from '@/features/captures/types';
import { renderLinks } from '@/features/captures/utils/linkParser';
import './CaptureItem.scss';

/**
 * Props for the CaptureItem component
 */
export interface CaptureItemProps {
  /** The capture data to display */
  capture: Capture;
  /** Callback function when a capture is updated */
  onUpdate: (id: number, content: string, title?: string, tags?: string[], capture_type_id?: number | null) => Promise<void>;
  /** Callback function when a capture is deleted */
  onDelete: (id: number) => Promise<void>;
  /** Whether the component should be disabled */
  disabled?: boolean;
}

/**
 * Component for displaying a single capture
 * 
 * Displays a capture with title, content (with clickable [[links]]), tags, and actions.
 * Clicking on the note navigates to the detail page. Links are rendered as clickable buttons.
 * 
 * @param {CaptureItemProps} props - Component props
 * @returns {ReactElement} The rendered capture item component
 * 
 * @example
 * ```tsx
 * <CaptureItem
 *   capture={capture}
 *   onUpdate={async (id, content, title, tags) => {
 *     await updateCapture(id, content, title, tags);
 *   }}
 *   onDelete={async (id) => {
 *     await deleteCapture(id);
 *   }}
 *   disabled={loading}
 * />
 * ```
 */
export const CaptureItem = ({
  capture,
  onUpdate,
  onDelete,
  disabled = false,
}: CaptureItemProps): ReactElement => {
  const navigate = useNavigate();

  /**
   * Handle navigation to detail page
   */
  const handleOpen = (): void => {
    navigate(`/captures/${capture.id}`);
  };

  /**
   * Handle link click - navigate to the linked note
   */
  const handleLinkClick = (linkTitle: string): void => {
    // Try to find the note by title or slug
    // For now, navigate to search or we could enhance this to find by slug
    navigate(`/captures?search=${encodeURIComponent(linkTitle)}`);
  };

  /**
   * Handle delete action
   */
  const handleDelete = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await onDelete(capture.id);
    } catch (err) {
      console.error('Error deleting capture:', err);
    }
  };

  const displayTitle = capture.title || capture.content.split('\n')[0]?.substring(0, 100) || 'Untitled';
  const displayContent = capture.content;

  return (
    <div className="capture-item">
      <div className="capture-item-header">
        <h3 className="capture-item-title">{displayTitle}</h3>
        <span className="capture-item-date">
          {new Date(capture.created_at).toLocaleDateString()}
        </span>
      </div>

      <div className="capture-item-content">
        <div className="capture-item-text">
          {renderLinks(displayContent, handleLinkClick)}
        </div>
        {capture.sketch_image && (
          <div className="capture-item-sketch">
            <img
              src={capture.sketch_image}
              alt="Sketch"
              className="capture-item-sketch-thumb"
            />
          </div>
        )}
        {capture.voice_audio && (
          <div className="capture-item-voice">
            <audio src={capture.voice_audio} controls className="capture-item-voice-audio" />
          </div>
        )}
      </div>

      {capture.tags && capture.tags.length > 0 && (
        <div className="capture-item-tags">
          {capture.tags.map((tag, index) => (
            <span key={index} className="capture-item-tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {capture.links_to && capture.links_to.length > 0 && (
        <div className="capture-item-links">
          <span className="capture-item-links-label">Links to:</span>
          {capture.links_to.map((linkedNote) => (
            <button
              key={linkedNote.id}
              className="capture-item-link"
              onClick={() => navigate(`/captures/${linkedNote.id}`)}
            >
              {linkedNote.title || linkedNote.slug}
            </button>
          ))}
        </div>
      )}

      {capture.linked_from && capture.linked_from.length > 0 && (
        <div className="capture-item-links">
          <span className="capture-item-links-label">Linked by:</span>
          {capture.linked_from.map((linkedNote) => (
            <button
              key={linkedNote.id}
              className="capture-item-link"
              onClick={() => navigate(`/captures/${linkedNote.id}`)}
            >
              {linkedNote.title || linkedNote.slug}
            </button>
          ))}
        </div>
      )}

      <div className="capture-item-actions">
        <button
          className="capture-item-button capture-item-button-open"
          onClick={handleOpen}
          disabled={disabled}
        >
          Open
        </button>
        <button
          className="capture-item-button capture-item-button-delete"
          onClick={handleDelete}
          disabled={disabled}
        >
          Delete
        </button>
      </div>
    </div>
  );
};


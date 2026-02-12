import { ReactElement, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capture } from '@/features/captures/types';
import { renderLinks } from '@/features/captures/utils/linkParser';
import { ConfirmModal } from '@/common/components/ui';
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
  /** Optional callback when a capture should be opened (e.g. in a modal instead of navigating) */
  onOpenCapture?: (captureId: number) => void;
  /** Optional callback when a link should be deleted (shows confirm modal) */
  onDeleteLink?: (linkId: number) => Promise<void>;
  /** Whether to show the highlighted state (e.g. scrolled to from graph node click) */
  highlighted?: boolean;
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
  onOpenCapture,
  onDeleteLink,
  highlighted = false,
  disabled = false,
}: CaptureItemProps): ReactElement => {
  const navigate = useNavigate();
  const [showDeleteLinkModal, setShowDeleteLinkModal] = useState(false);
  const [linkToDeleteId, setLinkToDeleteId] = useState<number | null>(null);
  const [showDeleteCaptureModal, setShowDeleteCaptureModal] = useState(false);

  /**
   * Handle opening capture: modal if onOpenCapture provided, else navigate
   */
  const handleOpen = (): void => {
    if (onOpenCapture) {
      onOpenCapture(capture.id);
    } else {
      navigate(`/captures/${capture.id}`);
    }
  };

  /**
   * Handle link click - navigate to the linked note
   */
  const handleLinkClick = (linkTitle: string): void => {
    // Try to find the note by title or slug
    // For now, navigate to search or we could enhance this to find by slug
    navigate(`/captures?search=${encodeURIComponent(linkTitle)}`);
  };

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteCaptureModal(true);
  }, []);

  const handleConfirmDeleteCapture = useCallback(async () => {
    try {
      await onDelete(capture.id);
      setShowDeleteCaptureModal(false);
    } catch (err) {
      console.error('Error deleting capture:', err);
    }
  }, [capture.id, onDelete]);

  const handleCloseDeleteCaptureModal = useCallback(() => {
    setShowDeleteCaptureModal(false);
  }, []);

  const handleDeleteLinkClick = useCallback(
    (e: React.MouseEvent, linkId: number) => {
      e.stopPropagation();
      setLinkToDeleteId(linkId);
      setShowDeleteLinkModal(true);
    },
    []
  );

  const handleConfirmDeleteLink = useCallback(async () => {
    if (linkToDeleteId == null || !onDeleteLink) return;
    try {
      await onDeleteLink(linkToDeleteId);
    } catch (err) {
      console.error('Error deleting link:', err);
    } finally {
      setShowDeleteLinkModal(false);
      setLinkToDeleteId(null);
    }
  }, [linkToDeleteId, onDeleteLink]);

  const handleCloseDeleteLinkModal = useCallback(() => {
    setShowDeleteLinkModal(false);
    setLinkToDeleteId(null);
  }, []);

  const displayTitle = capture.title || capture.content.split('\n')[0]?.substring(0, 100) || 'Untitled';
  const displayContent = capture.content;

  return (
    <div
      className={`capture-item${highlighted ? ' capture-item--highlighted' : ''}`}
      id={`capture-item-${capture.id}`}
    >
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
          <span className="capture-item-tags-label">Tags:</span>
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
            <span key={linkedNote.id} className="capture-item-link-wrap">
              <button
                className="capture-item-link"
                onClick={() =>
                  onOpenCapture ? onOpenCapture(linkedNote.id) : navigate(`/captures/${linkedNote.id}`)
                }
              >
                {linkedNote.title || linkedNote.slug}
              </button>
              {onDeleteLink && linkedNote.pivot?.id != null && (
                <button
                  type="button"
                  className="capture-item-link-delete"
                  onClick={(e) => handleDeleteLinkClick(e, linkedNote.pivot!.id)}
                  title="Delete link"
                  aria-label="Delete link"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {capture.linked_from && capture.linked_from.length > 0 && (
        <div className="capture-item-links">
          <span className="capture-item-links-label">Linked by:</span>
          {capture.linked_from.map((linkedNote) => (
            <span key={linkedNote.id} className="capture-item-link-wrap">
              <button
                className="capture-item-link"
                onClick={() =>
                  onOpenCapture ? onOpenCapture(linkedNote.id) : navigate(`/captures/${linkedNote.id}`)
                }
              >
                {linkedNote.title || linkedNote.slug}
              </button>
              {onDeleteLink && linkedNote.pivot?.id != null && (
                <button
                  type="button"
                  className="capture-item-link-delete"
                  onClick={(e) => handleDeleteLinkClick(e, linkedNote.pivot!.id)}
                  title="Delete link"
                  aria-label="Delete link"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteLinkModal}
        onClose={handleCloseDeleteLinkModal}
        onConfirm={handleConfirmDeleteLink}
        title="Delete link"
        message="Do you want to delete that link?"
        confirmText="Delete"
        cancelText="Cancel"
      />

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
          onClick={handleDeleteClick}
          disabled={disabled}
        >
          Delete
        </button>
      </div>

      <ConfirmModal
        isOpen={showDeleteCaptureModal}
        onClose={handleCloseDeleteCaptureModal}
        onConfirm={handleConfirmDeleteCapture}
        title="Delete note"
        message="Are you sure you want to delete this note?"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};


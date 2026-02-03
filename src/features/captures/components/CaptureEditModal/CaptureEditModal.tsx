import { useEffect, useState, ReactElement, useRef } from 'react';
import { createPortal } from 'react-dom';
import { capturesService } from '@/features/captures/services/captures.service';
import { Capture } from '@/features/captures/types';
import { useCapture } from '@/features/captures/hooks/useCapture';
import { CaptureInput } from '@/features/captures/components/CaptureInput';
import { CaptureForm } from '@/features/captures/components/CaptureForm';
import { Button } from '@/common/components/ui/Button';
import './CaptureEditModal.scss';

/**
 * Props for the CaptureEditModal component
 */
export interface CaptureEditModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** The ID of the capture to edit */
  captureId: number | null;
  /** Callback when capture is successfully updated, receives the updated capture data */
  onUpdateSuccess?: (updatedCapture: Capture) => void;
}

/**
 * Modal component for editing a capture
 * 
 * Displays a modal with a form to edit an existing capture.
 * Loads the capture data when opened and handles updates.
 * 
 * @param {CaptureEditModalProps} props - Component props
 * @returns {ReactElement | null} The rendered modal or null if not open
 * 
 * @example
 * ```tsx
 * <CaptureEditModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   captureId={123}
 *   onUpdateSuccess={() => refreshGraph()}
 * />
 * ```
 */
export const CaptureEditModal = ({
  isOpen,
  onClose,
  captureId,
  onUpdateSuccess,
}: CaptureEditModalProps): ReactElement | null => {
  const [capture, setCapture] = useState<Capture | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState<boolean>(true);
  const { loading: updateLoading, error: updateError, updateCapture } = useCapture();
  const submitHandlerRef = useRef<(() => Promise<void>) | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const isUpdatingRef = useRef<boolean>(false);

  /**
   * Load the capture by ID when modal opens
   */
  useEffect(() => {
    if (!isOpen || !captureId || isUpdatingRef.current) {
      return;
    }

    const loadCapture = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        const data = await capturesService.getCapture(captureId);
        setCapture(data);
      } catch (err) {
        setError('Failed to load capture. Please try again.');
        console.error('Error loading capture:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCapture();
  }, [isOpen, captureId]);

  /**
   * Handle modal open/close animations
   */
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Slight delay to trigger animation
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else if (shouldRender) {
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
        // Reset state when modal closes
        setCapture(null);
        setError(null);
        setSuccessMessage(null);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  /**
   * Handle escape key to close modal
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  /**
   * Prevent body scroll when modal is open
   */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  /**
   * Handle capture update
   */
  const handleUpdate = async (
    content: string,
    title?: string,
    tags?: string[],
    capture_type_id?: number | null,
    capture_status_id?: number | null
  ): Promise<void> => {
    if (!capture) return;
    
    // Mark as updating to prevent reload
    isUpdatingRef.current = true;
    
    try {
      await updateCapture(capture.id, content, title, tags, capture_type_id, capture_status_id);
      
      // Fetch the updated capture to get all the latest data
      if (captureId) {
        try {
          const updated = await capturesService.getCapture(captureId);
          
          // Close modal immediately to prevent reopening
          onClose();
          
          // Call success callback with updated capture data
          setTimeout(() => {
            if (onUpdateSuccess) {
              onUpdateSuccess(updated);
            }
            // Reset updating flag after a delay
            setTimeout(() => {
              isUpdatingRef.current = false;
            }, 100);
          }, 50);
        } catch (err) {
          console.error('Error fetching updated capture:', err);
          // Still close the modal even if fetch fails
          onClose();
          isUpdatingRef.current = false;
        }
      } else {
        onClose();
        isUpdatingRef.current = false;
      }
    } catch (err) {
      // Error handling is done by CaptureForm via error prop
      console.error('Error updating note:', err);
      isUpdatingRef.current = false;
    }
  };

  /**
   * Handle overlay click to close modal
   */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the overlay itself, not its children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!shouldRender) return null;

  const modalContent = (
    <div 
      className={`capture-edit-modal-overlay ${isAnimating ? 'capture-edit-modal-overlay--open' : ''}`}
      onClick={handleOverlayClick}
    >
      <div 
        className={`capture-edit-modal-dialog ${isAnimating ? 'capture-edit-modal-dialog--open' : ''}`}
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="capture-edit-modal-header">
          <h2 id="modal-title" className="capture-edit-modal-title">
            Edit Note
          </h2>
          <button
            className="capture-edit-modal-close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="capture-edit-modal-body">
          {loading && (
            <div className="capture-edit-modal-loading">Loading capture...</div>
          )}

          {error && !loading && (
            <div className="capture-edit-modal-error" role="alert">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="capture-edit-modal-success" role="alert">
              {successMessage}
            </div>
          )}

          {!loading && capture && (
            <div className="capture-edit-modal-form">
              <CaptureForm error={updateError || error}>
                <CaptureInput
                  onSubmit={handleUpdate}
                  disabled={updateLoading}
                  placeholder="Write your note here. Use [[double brackets]] to link to other notes..."
                  initialTitle={capture.title || ''}
                  initialContent={capture.content}
                  initialTags={capture.tags?.join(', ') || ''}
                  initialCaptureTypeId={capture.capture_type_id || null}
                  initialCaptureStatusId={capture.capture_status_id || null}
                  captureId={capture.id}
                  hideSubmitButton={true}
                  onSubmitHandlerReady={(handler) => {
                    submitHandlerRef.current = handler;
                  }}
                  onFormValidityChange={setIsFormValid}
                />
              </CaptureForm>
            </div>
          )}
        </div>

        {!loading && capture && (
          <div className="capture-edit-modal-footer">
            <Button
              onClick={() => submitHandlerRef.current?.()}
              disabled={!isFormValid || updateLoading}
              loading={updateLoading}
            >
              {updateLoading ? 'Saving...' : 'Update Note'}
            </Button>
            <button
              className="capture-edit-modal-button-cancel"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

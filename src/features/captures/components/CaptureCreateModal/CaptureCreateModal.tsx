import { useEffect, useState, ReactElement, useRef } from 'react';
import { createPortal } from 'react-dom';
import { capturesService } from '@/features/captures/services/captures.service';
import { Capture } from '@/features/captures/types';
import { CaptureInput } from '@/features/captures/components/CaptureInput';
import { CaptureForm } from '@/features/captures/components/CaptureForm';
import { Button } from '@/common/components/ui/Button';
import './CaptureCreateModal.scss';

/**
 * Props for the CaptureCreateModal component
 */
export interface CaptureCreateModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when capture is successfully created, receives the new capture data */
  onCreateSuccess?: (capture: Capture) => void;
  /** Optional graph position; when provided, the new capture will be created at this position */
  initialPosition?: { x: number; y: number };
}

/**
 * Modal component for creating a new capture
 *
 * Displays a modal with a form to create a capture. When initialPosition is provided
 * (e.g. from double-click on the graph canvas), the capture is created at that position.
 *
 * @param {CaptureCreateModalProps} props - Component props
 * @returns {ReactElement | null} The rendered modal or null if not open
 */
export const CaptureCreateModal = ({
  isOpen,
  onClose,
  onCreateSuccess,
  initialPosition,
}: CaptureCreateModalProps): ReactElement | null => {
  const [error, setError] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const submitHandlerRef = useRef<(() => Promise<void>) | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  /**
   * Handle modal open/close animations
   */
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setError(null);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else if (shouldRender) {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setError(null);
      }, 300);
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
   * Handle capture creation
   */
  const handleCreate = async (
    content: string,
    title?: string,
    tags?: string[],
    capture_type_id?: number | null,
    capture_status_id?: number | null,
    sketch_image?: string | null
  ): Promise<void> => {
    try {
      setCreateLoading(true);
      setError(null);

      const graph_x = initialPosition?.x;
      const graph_y = initialPosition?.y;

      const capture = await capturesService.createCapture(
        content,
        title,
        tags,
        capture_type_id,
        capture_status_id,
        sketch_image,
        graph_x,
        graph_y
      );

      onClose();
      if (onCreateSuccess) {
        onCreateSuccess(capture);
      }
    } catch (err) {
      setError('Failed to create note. Please try again.');
      console.error('Error creating capture:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  /**
   * Handle overlay click to close modal
   */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!shouldRender) return null;

  const modalContent = (
    <div
      className={`capture-create-modal-overlay ${isAnimating ? 'capture-create-modal-overlay--open' : ''}`}
      onClick={handleOverlayClick}
    >
      <div
        className={`capture-create-modal-dialog ${isAnimating ? 'capture-create-modal-dialog--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="capture-create-modal-header">
          <h2 id="create-modal-title" className="capture-create-modal-title">
            Create Note
          </h2>
          <button
            className="capture-create-modal-close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="capture-create-modal-body">
          <div className="capture-create-modal-form">
            <CaptureForm error={error}>
              <CaptureInput
                onSubmit={handleCreate}
                disabled={createLoading}
                placeholder="Write your note here. Use [[double brackets]] to link to other notes..."
                submitButtonText="Create Note"
                hideSubmitButton={true}
                onSubmitHandlerReady={(handler) => {
                  submitHandlerRef.current = handler;
                }}
                onFormValidityChange={setIsFormValid}
              />
            </CaptureForm>
          </div>
        </div>

        <div className="capture-create-modal-footer">
          <Button
            onClick={() => submitHandlerRef.current?.()}
            disabled={!isFormValid || createLoading}
            loading={createLoading}
          >
            {createLoading ? 'Creating...' : 'Create Note'}
          </Button>
          <button
            className="capture-create-modal-button-cancel"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

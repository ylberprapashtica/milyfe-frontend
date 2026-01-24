import { ReactElement, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmModal.scss';

/**
 * Props for the ConfirmModal component
 */
export interface ConfirmModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when user confirms action */
  onConfirm: () => void;
  /** Modal title */
  title: string;
  /** Modal message/description */
  message: string;
  /** Text for confirm button (default: "Confirm") */
  confirmText?: string;
  /** Text for cancel button (default: "Cancel") */
  cancelText?: string;
}

/**
 * Reusable confirmation modal component
 * 
 * @param {ConfirmModalProps} props - Component props
 * @returns {ReactElement | null} The rendered modal or null if not open
 * 
 * @example
 * ```tsx
 * <ConfirmModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item?"
 * />
 * ```
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: ConfirmModalProps): ReactElement | null => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

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
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  // Handle escape key to close modal
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

  // Prevent body scroll when modal is open
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

  if (!shouldRender) return null;

  const handleConfirmClick = () => {
    onConfirm();
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the overlay itself, not its children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div 
      className={`confirm-modal-overlay ${isAnimating ? 'confirm-modal-overlay--open' : ''}`}
      onClick={handleOverlayClick}
    >
      <div 
        className={`confirm-modal-dialog ${isAnimating ? 'confirm-modal-dialog--open' : ''}`}
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title"
      >
        <div className="confirm-modal-header">
          <h2 id="modal-title" className="confirm-modal-title">
            {title}
          </h2>
          <button
            className="confirm-modal-close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            ×
          </button>
        </div>
        <div className="confirm-modal-body">
          <p className="confirm-modal-message">{message}</p>
        </div>
        <div className="confirm-modal-footer">
          <button
            className="confirm-modal-button confirm-modal-button--cancel"
            onClick={onClose}
            type="button"
          >
            {cancelText}
          </button>
          <button
            className="confirm-modal-button confirm-modal-button--confirm"
            onClick={handleConfirmClick}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

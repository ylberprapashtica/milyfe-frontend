import { useState, KeyboardEvent, ChangeEvent, ReactElement } from 'react';
import { Capture } from '../../types';
import './CaptureItem.scss';

/**
 * Props for the CaptureItem component
 */
export interface CaptureItemProps {
  /** The capture data to display */
  capture: Capture;
  /** Callback function when a capture is updated */
  onUpdate: (id: number, thought: string) => Promise<void>;
  /** Callback function when a capture is deleted */
  onDelete: (id: number) => Promise<void>;
  /** Whether the component should be disabled */
  disabled?: boolean;
}

/**
 * Component for displaying and editing a single capture
 * 
 * Displays a capture with edit and delete actions. Supports inline editing
 * with Enter to save and Escape to cancel. Shows a confirmation dialog
 * before deleting.
 * 
 * @param {CaptureItemProps} props - Component props
 * @returns {ReactElement} The rendered capture item component
 * 
 * @example
 * ```tsx
 * <CaptureItem
 *   capture={capture}
 *   onUpdate={async (id, thought) => {
 *     await updateCapture(id, thought);
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
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingThought, setEditingThought] = useState<string>('');

  /**
   * Start editing mode
   */
  const startEdit = (): void => {
    setIsEditing(true);
    setEditingThought(capture.thought);
  };

  /**
   * Cancel editing mode
   */
  const cancelEdit = (): void => {
    setIsEditing(false);
    setEditingThought('');
  };

  /**
   * Handle update submission
   */
  const handleUpdate = async (): Promise<void> => {
    if (!editingThought.trim() || disabled) {
      return;
    }

    try {
      await onUpdate(capture.id, editingThought.trim());
      setIsEditing(false);
      setEditingThought('');
    } catch (err) {
      // Error handling is done by the parent component
      console.error('Error updating capture:', err);
    }
  };

  /**
   * Handle delete action
   */
  const handleDelete = async (): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this capture?')) {
      return;
    }

    try {
      await onDelete(capture.id);
    } catch (err) {
      // Error handling is done by the parent component
      console.error('Error deleting capture:', err);
    }
  };

  /**
   * Handle keyboard events in edit mode
   */
  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleUpdate();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  /**
   * Handle input change in edit mode
   */
  const handleEditChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setEditingThought(e.target.value);
  };

  return (
    <li className="capture-item">
      {isEditing ? (
        <div className="capture-item-edit">
          <input
            type="text"
            className="capture-item-input"
            value={editingThought}
            onChange={handleEditChange}
            onKeyDown={handleEditKeyDown}
            disabled={disabled}
            autoFocus
          />
          <div className="capture-item-actions">
            <button
              className="capture-item-button capture-item-button-save"
              onClick={handleUpdate}
              disabled={!editingThought.trim() || disabled}
            >
              Save
            </button>
            <button
              className="capture-item-button capture-item-button-cancel"
              onClick={cancelEdit}
              disabled={disabled}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="capture-item-content">
            <p className="capture-item-thought">{capture.thought}</p>
            <span className="capture-item-date">
              {new Date(capture.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="capture-item-actions">
            <button
              className="capture-item-button capture-item-button-edit"
              onClick={startEdit}
              disabled={disabled}
            >
              Edit
            </button>
            <button
              className="capture-item-button capture-item-button-delete"
              onClick={handleDelete}
              disabled={disabled}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </li>
  );
};


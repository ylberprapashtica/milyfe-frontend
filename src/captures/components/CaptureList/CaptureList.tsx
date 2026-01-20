import { ReactElement } from 'react';
import { Capture } from '../../types';
import { CaptureItem, CaptureItemProps } from '../CaptureItem';
import './CaptureList.scss';

/**
 * Props for the CaptureList component
 */
export interface CaptureListProps {
  /** Array of captures to display */
  captures: Capture[];
  /** Callback function when a capture is updated */
  onUpdate: (id: number, content: string, title?: string, tags?: string[]) => Promise<void>;
  /** Callback function when a capture is deleted */
  onDelete: (id: number) => Promise<void>;
  /** Whether the list should be disabled */
  disabled?: boolean;
  /** Whether the list is currently loading */
  loading?: boolean;
}

/**
 * Component for displaying a list of captures
 * 
 * Renders a list of CaptureItem components and handles empty/loading states.
 * The component displays appropriate messages when there are no captures
 * or when data is being loaded.
 * 
 * @param {CaptureListProps} props - Component props
 * @returns {ReactElement} The rendered capture list component
 * 
 * @example
 * ```tsx
 * <CaptureList
 *   captures={captures}
 *   onUpdate={async (id, thought) => {
 *     await updateCapture(id, thought);
 *   }}
 *   onDelete={async (id) => {
 *     await deleteCapture(id);
 *   }}
 *   disabled={loading}
 *   loading={loading}
 * />
 * ```
 */
export const CaptureList = ({
  captures,
  onUpdate,
  onDelete,
  disabled = false,
  loading = false,
}: CaptureListProps): ReactElement => {
  if (loading && captures.length === 0) {
    return (
      <div className="capture-list">
        <h2 className="capture-list-title">Your Captures</h2>
        <div className="capture-list-loading">Loading captures...</div>
      </div>
    );
  }

  if (captures.length === 0) {
    return (
      <div className="capture-list">
        <h2 className="capture-list-title">Your Captures</h2>
        <div className="capture-list-empty">
          No captures yet. Start capturing your thoughts!
        </div>
      </div>
    );
  }

  return (
    <div className="capture-list">
      <h2 className="capture-list-title">Your Captures</h2>
      <ul className="capture-list-items">
        {captures.map((capture) => (
          <CaptureItem
            key={capture.id}
            capture={capture}
            onUpdate={onUpdate}
            onDelete={onDelete}
            disabled={disabled}
          />
        ))}
      </ul>
    </div>
  );
};


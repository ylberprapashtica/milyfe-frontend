import { ReactElement } from 'react';
import { Capture } from '@/features/captures/types';
import { CaptureItem, CaptureItemProps } from '@/features/captures/components/CaptureItem';
import './CaptureList.scss';

/**
 * Props for the CaptureList component
 */
export interface CaptureListProps {
  /** Array of captures to display */
  captures: Capture[];
  /** Callback function when a capture is updated */
  onUpdate: (id: number, content: string, title?: string, tags?: string[], capture_type_id?: number | null) => Promise<void>;
  /** Callback function when a capture is deleted */
  onDelete: (id: number) => Promise<void>;
  /** Optional callback when a capture should be opened (e.g. in a modal) */
  onOpenCapture?: (captureId: number) => void;
  /** Optional callback when a link should be deleted (confirm modal in CaptureItem) */
  onDeleteLink?: (linkId: number) => Promise<void>;
  /** Optional capture ID to show as highlighted (e.g. scrolled to from graph) */
  highlightedCaptureId?: number | null;
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
  onOpenCapture,
  onDeleteLink,
  highlightedCaptureId = null,
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
            onOpenCapture={onOpenCapture}
            onDeleteLink={onDeleteLink}
            highlighted={highlightedCaptureId === capture.id}
            disabled={disabled}
          />
        ))}
      </ul>
    </div>
  );
};


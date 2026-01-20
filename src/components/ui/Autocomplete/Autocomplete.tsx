import { ReactElement, useEffect, useRef, KeyboardEvent } from 'react';
import { Capture } from '../../../services/api';
import './Autocomplete.scss';

/**
 * Props for the Autocomplete component
 */
export interface AutocompleteProps {
  /** Array of capture suggestions to display */
  suggestions: Capture[];
  /** Current query string being typed */
  query: string;
  /** Index of the currently selected item */
  selectedIndex: number;
  /** Callback when a suggestion is selected */
  onSelect: (capture: Capture) => void;
  /** Callback when the autocomplete should be closed */
  onClose: () => void;
  /** Position where the dropdown should appear */
  position: { top: number; left: number } | null;
  /** Whether the autocomplete is visible */
  visible: boolean;
}

/**
 * Autocomplete dropdown component for capture suggestions
 * 
 * Displays a list of capture suggestions with title and content preview.
 * Supports keyboard navigation and mouse selection.
 * 
 * @param {AutocompleteProps} props - Component props
 * @returns {ReactElement} The rendered autocomplete component
 * 
 * @example
 * ```tsx
 * <Autocomplete
 *   suggestions={captures}
 *   query="note"
 *   selectedIndex={0}
 *   onSelect={(capture) => insertLink(capture.title)}
 *   onClose={() => setVisible(false)}
 *   position={{ top: 100, left: 50 }}
 *   visible={true}
 * />
 * ```
 */
export const Autocomplete = ({
  suggestions,
  query,
  selectedIndex,
  onSelect,
  onClose,
  position,
  visible,
}: AutocompleteProps): ReactElement => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  /**
   * Scroll selected item into view
   */
  useEffect(() => {
    if (selectedItemRef.current && dropdownRef.current) {
      const item = selectedItemRef.current;
      const container = dropdownRef.current;
      const itemTop = item.offsetTop;
      const itemBottom = itemTop + item.offsetHeight;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.offsetHeight;

      if (itemTop < containerTop) {
        container.scrollTop = itemTop;
      } else if (itemBottom > containerBottom) {
        container.scrollTop = itemBottom - container.offsetHeight;
      }
    }
  }, [selectedIndex]);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!visible || !position || suggestions.length === 0) {
    return <></>;
  }

  /**
   * Get display title for a capture
   */
  const getDisplayTitle = (capture: Capture): string => {
    return capture.title || capture.content.split('\n')[0]?.substring(0, 100) || 'Untitled';
  };

  /**
   * Get content preview (first 80 characters)
   */
  const getContentPreview = (capture: Capture): string => {
    const content = capture.content.split('\n')[0] || '';
    return content.length > 80 ? `${content.substring(0, 80)}...` : content;
  };

  return (
    <div
      ref={dropdownRef}
      className="ui-autocomplete"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onKeyDown={handleKeyDown}
      role="listbox"
      aria-label="Capture suggestions"
    >
      {suggestions.map((capture, index) => {
        const isSelected = index === selectedIndex;
        const displayTitle = getDisplayTitle(capture);
        const preview = getContentPreview(capture);

        return (
          <button
            key={capture.id}
            ref={isSelected ? selectedItemRef : null}
            type="button"
            className={`ui-autocomplete-item ${isSelected ? 'ui-autocomplete-item--selected' : ''}`}
            onClick={() => onSelect(capture)}
            role="option"
            aria-selected={isSelected}
          >
            <div className="ui-autocomplete-item-title">{displayTitle}</div>
            <div className="ui-autocomplete-item-preview">{preview}</div>
          </button>
        );
      })}
    </div>
  );
};

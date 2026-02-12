import { ReactElement, useEffect, useRef, KeyboardEvent } from 'react';
import './TagsAutocomplete.scss';

/**
 * Props for the TagsAutocomplete component
 */
export interface TagsAutocompleteProps {
  /** Array of tag name suggestions */
  suggestions: string[];
  /** Index of the currently selected item */
  selectedIndex: number;
  /** Callback when a suggestion is selected */
  onSelect: (tag: string) => void;
  /** Callback when the autocomplete should be closed */
  onClose: () => void;
  /** Whether the autocomplete is visible */
  visible: boolean;
}

/**
 * Autocomplete dropdown for tag suggestions
 *
 * Displays a list of tag suggestions. User can select to add a tag.
 */
export const TagsAutocomplete = ({
  suggestions,
  selectedIndex,
  onSelect,
  onClose,
  visible,
}: TagsAutocompleteProps): ReactElement => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

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

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!visible || suggestions.length === 0) {
    return <></>;
  }

  return (
    <div
      ref={dropdownRef}
      className="tags-autocomplete"
      onKeyDown={handleKeyDown}
      role="listbox"
      aria-label="Tag suggestions"
    >
      {suggestions.map((tag, index) => {
        const isSelected = index === selectedIndex;
        return (
          <button
            key={tag}
            ref={isSelected ? selectedItemRef : null}
            type="button"
            className={`tags-autocomplete-item ${isSelected ? 'tags-autocomplete-item--selected' : ''}`}
            onClick={() => onSelect(tag)}
            role="option"
            aria-selected={isSelected}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
};

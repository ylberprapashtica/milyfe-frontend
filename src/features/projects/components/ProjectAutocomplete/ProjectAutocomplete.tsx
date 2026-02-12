import { ReactElement, useEffect, useRef, KeyboardEvent } from 'react';
import type { Project } from '@/features/projects/types';
import './ProjectAutocomplete.scss';

export type ProjectSuggestion =
  | Project
  | { name: string; isCreate: true }
  | { name: 'No project'; isNoProject: true };

export interface ProjectAutocompleteProps {
  /** Array of project suggestions (existing + optional create option) */
  suggestions: ProjectSuggestion[];
  /** Index of the currently selected item */
  selectedIndex: number;
  /** Callback when a suggestion is selected */
  onSelect: (suggestion: ProjectSuggestion) => void;
  /** Callback when the autocomplete should be closed */
  onClose: () => void;
  /** Whether the autocomplete is visible */
  visible: boolean;
}

/**
 * Autocomplete dropdown for project selection.
 * Shows existing projects filtered by query, plus "Create [name]" when typing a new project name.
 */
export const ProjectAutocomplete = ({
  suggestions,
  selectedIndex,
  onSelect,
  onClose,
  visible,
}: ProjectAutocompleteProps): ReactElement => {
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

  const isCreate = (s: ProjectSuggestion): s is { name: string; isCreate: true } =>
    'isCreate' in s && s.isCreate;
  const isNoProject = (s: ProjectSuggestion): s is { name: 'No project'; isNoProject: true } =>
    'isNoProject' in s && s.isNoProject;

  if (!visible || suggestions.length === 0) {
    return <></>;
  }

  return (
    <div
      ref={dropdownRef}
      className="project-autocomplete"
      onKeyDown={handleKeyDown}
      role="listbox"
      aria-label="Project suggestions"
    >
      {suggestions.map((suggestion, index) => {
        const isSelected = index === selectedIndex;
        const label = isCreate(suggestion)
          ? `Create "${suggestion.name}"`
          : suggestion.name;

        return (
          <button
            key={isCreate(suggestion) ? `create-${suggestion.name}` : isNoProject(suggestion) ? 'no-project' : String(suggestion.id)}
            ref={isSelected ? selectedItemRef : null}
            type="button"
            className={`project-autocomplete-item ${isSelected ? 'project-autocomplete-item--selected' : ''} ${isCreate(suggestion) ? 'project-autocomplete-item--create' : ''}`}
            onClick={() => onSelect(suggestion)}
            role="option"
            aria-selected={isSelected}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

import { useState, ReactElement } from 'react';
import './GraphFilters.scss';

/**
 * Available status options
 */
const STATUS_OPTIONS = [
  { value: 'fleeting', label: 'Fleeting' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'organized', label: 'Organized' },
  { value: 'implemented', label: 'Implemented' },
  { value: 'forgotten', label: 'Forgotten' },
  { value: 'deleted', label: 'Deleted' },
] as const;

/**
 * Available type options
 */
const TYPE_OPTIONS = [
  { value: 'memory', label: 'Memory', symbol: '<<' },
  { value: 'describing', label: 'Describing', symbol: '<' },
  { value: 'action', label: 'Action', symbol: '0' },
  { value: 'planning', label: 'Planning', symbol: '>' },
  { value: 'dreaming', label: 'Dreaming', symbol: '>>' },
] as const;

/**
 * Props for the GraphFilters component
 */
export interface GraphFiltersProps {
  /** Selected status filters */
  selectedStatuses: string[];
  /** Selected type filters */
  selectedTypes: string[];
  /** Callback when status filters change */
  onStatusChange: (statuses: string[]) => void;
  /** Callback when type filters change */
  onTypeChange: (types: string[]) => void;
  /** Callback to clear all filters */
  onClearFilters: () => void;
}

/**
 * Graph filters component for filtering nodes by status and type
 * 
 * @param {GraphFiltersProps} props - Component props
 * @returns {ReactElement} The rendered filter controls
 */
export const GraphFilters = ({
  selectedStatuses,
  selectedTypes,
  onStatusChange,
  onTypeChange,
  onClearFilters,
}: GraphFiltersProps): ReactElement => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  /**
   * Handle status checkbox change
   */
  const handleStatusChange = (status: string, checked: boolean): void => {
    if (checked) {
      onStatusChange([...selectedStatuses, status]);
    } else {
      onStatusChange(selectedStatuses.filter((s) => s !== status));
    }
  };

  /**
   * Handle type checkbox change
   */
  const handleTypeChange = (type: string, checked: boolean): void => {
    if (checked) {
      onTypeChange([...selectedTypes, type]);
    } else {
      onTypeChange(selectedTypes.filter((t) => t !== type));
    }
  };

  const hasActiveFilters = selectedStatuses.length > 0 || selectedTypes.length > 0;

  return (
    <div className="graph-filters">
      <button
        className="graph-filters-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
        aria-expanded={isExpanded}
      >
        <span className="graph-filters-toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="graph-filters-toggle-text">Filters</span>
        {hasActiveFilters && (
          <span className="graph-filters-badge" aria-label="Active filters">
            {selectedStatuses.length + selectedTypes.length}
          </span>
        )}
      </button>

      {isExpanded && (
        <div 
          className="graph-filters-panel"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="graph-filters-section">
            <h3 className="graph-filters-section-title">Status</h3>
            <div className="graph-filters-options">
              {STATUS_OPTIONS.map((option) => (
                <label key={option.value} className="graph-filters-option">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(option.value)}
                    onChange={(e) => handleStatusChange(option.value, e.target.checked)}
                    className="graph-filters-checkbox"
                  />
                  <span className="graph-filters-label">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="graph-filters-section">
            <h3 className="graph-filters-section-title">Type</h3>
            <div className="graph-filters-options">
              {TYPE_OPTIONS.map((option) => (
                <label key={option.value} className="graph-filters-option">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(option.value)}
                    onChange={(e) => handleTypeChange(option.value, e.target.checked)}
                    className="graph-filters-checkbox"
                  />
                  <span className="graph-filters-label">
                    <span className="graph-filters-type-symbol">{option.symbol}</span>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button
              className="graph-filters-clear"
              onClick={onClearFilters}
              aria-label="Clear all filters"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

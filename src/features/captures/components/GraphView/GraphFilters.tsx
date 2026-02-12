import { useState, useEffect, ReactElement } from 'react';
import { projectsService } from '@/features/projects/services/projects.service';
import type { Project } from '@/features/projects/types';
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
  { value: 'eureka', label: 'Eureka', symbol: '!' },
] as const;

/**
 * Props for the GraphFilters component
 */
export interface GraphFiltersProps {
  /** Selected status filters */
  selectedStatuses: string[];
  /** Selected type filters */
  selectedTypes: string[];
  /** Whether project view is enabled */
  projectView?: boolean;
  /** Callback when status filters change */
  onStatusChange: (statuses: string[]) => void;
  /** Callback when type filters change */
  onTypeChange: (types: string[]) => void;
  /** Selected project filters (project ID strings; use "none" for unassigned) */
  selectedProjects?: string[];
  /** Callback when project filters change */
  onProjectChange?: (projects: string[]) => void;
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
  selectedProjects = [],
  onStatusChange,
  onTypeChange,
  onProjectChange,
  onClearFilters,
}: GraphFiltersProps): ReactElement => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const list = await projectsService.getProjects();
        setProjects(list);
      } catch (err) {
        console.error('Error loading projects for filters:', err);
      }
    };
    load();
  }, []);

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

  /**
   * Handle project checkbox change
   */
  const handleProjectChange = (value: string, checked: boolean): void => {
    if (!onProjectChange) return;
    if (checked) {
      onProjectChange([...selectedProjects, value]);
    } else {
      onProjectChange(selectedProjects.filter((p) => p !== value));
    }
  };

  const hasActiveFilters =
    selectedStatuses.length > 0 || selectedTypes.length > 0 || selectedProjects.length > 0;

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
            {selectedStatuses.length + selectedTypes.length + selectedProjects.length}
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

          {onProjectChange && (
            <div className="graph-filters-section">
              <h3 className="graph-filters-section-title">Project</h3>
              <div className="graph-filters-options">
                <label key="none" className="graph-filters-option">
                  <input
                    type="checkbox"
                    checked={selectedProjects.includes('none')}
                    onChange={(e) => handleProjectChange('none', e.target.checked)}
                    className="graph-filters-checkbox"
                  />
                  <span className="graph-filters-label">No project</span>
                </label>
                {projects.map((project) => (
                  <label key={project.id} className="graph-filters-option">
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(String(project.id))}
                      onChange={(e) => handleProjectChange(String(project.id), e.target.checked)}
                      className="graph-filters-checkbox"
                    />
                    <span className="graph-filters-label">{project.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

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

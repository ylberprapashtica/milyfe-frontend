import { ReactElement, SelectHTMLAttributes, ChangeEvent } from 'react';
import './Select.scss';

/**
 * Option for the Select component
 */
export interface SelectOption {
  /** The value of the option */
  value: string | number;
  /** The display label for the option */
  label: string;
}

/**
 * Props for the Select component
 */
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  /** Label text for the select */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Additional CSS class name */
  className?: string;
  /** Array of options to display */
  options: SelectOption[];
}

/**
 * Reusable Select component
 * 
 * A styled select component that follows the app's design system with
 * glassmorphism effects, labels, and error states.
 * 
 * @param {SelectProps} props - Component props
 * @returns {ReactElement} The rendered select component
 * 
 * @example
 * ```tsx
 * <Select
 *   id="type"
 *   label="Type (optional)"
 *   value={type}
 *   onChange={handleChange}
 *   options={[
 *     { value: '', label: 'None' },
 *     { value: '1', label: 'Memory' },
 *   ]}
 *   disabled={loading}
 * />
 * ```
 */
export const Select = ({
  id,
  label,
  error,
  className = '',
  options,
  ...props
}: SelectProps): ReactElement => {
  const selectClasses = [
    'ui-select',
    error && 'ui-select--error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="ui-select-wrapper">
      {label && (
        <label htmlFor={id} className="ui-select-label">
          {label}
        </label>
      )}
      <select
        id={id}
        className={selectClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div id={`${id}-error`} className="ui-select-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

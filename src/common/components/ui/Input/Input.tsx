import { ReactElement, InputHTMLAttributes, ChangeEvent } from 'react';
import './Input.scss';

/**
 * Props for the Input component
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  /** Label text for the input */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Reusable Input component
 * 
 * A styled input component that follows the app's design system with
 * glassmorphism effects, labels, and error states.
 * 
 * @param {InputProps} props - Component props
 * @returns {ReactElement} The rendered input component
 * 
 * @example
 * ```tsx
 * <Input
 *   id="title"
 *   label="Title (optional)"
 *   value={title}
 *   onChange={handleChange}
 *   placeholder="Note title"
 *   disabled={loading}
 * />
 * ```
 */
export const Input = ({
  id,
  label,
  error,
  className = '',
  ...props
}: InputProps): ReactElement => {
  const inputClasses = [
    'ui-input',
    error && 'ui-input--error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="ui-input-wrapper">
      {label && (
        <label htmlFor={id} className="ui-input-label">
          {label}
        </label>
      )}
      <input
        id={id}
        className={inputClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <div id={`${id}-error`} className="ui-input-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

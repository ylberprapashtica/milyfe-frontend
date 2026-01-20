import { ReactElement, TextareaHTMLAttributes } from 'react';
import './Textarea.scss';

/**
 * Props for the Textarea component
 */
export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  /** Label text for the textarea */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Reusable Textarea component
 * 
 * A styled textarea component that follows the app's design system with
 * glassmorphism effects, labels, and error states.
 * 
 * @param {TextareaProps} props - Component props
 * @returns {ReactElement} The rendered textarea component
 * 
 * @example
 * ```tsx
 * <Textarea
 *   id="content"
 *   label="Content *"
 *   value={content}
 *   onChange={handleChange}
 *   placeholder="Write your note here..."
 *   rows={8}
 *   disabled={loading}
 * />
 * ```
 */
export const Textarea = ({
  id,
  label,
  error,
  className = '',
  ...props
}: TextareaProps): ReactElement => {
  const textareaClasses = [
    'ui-textarea',
    error && 'ui-textarea--error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="ui-textarea-wrapper">
      {label && (
        <label htmlFor={id} className="ui-textarea-label">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={textareaClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <div id={`${id}-error`} className="ui-textarea-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

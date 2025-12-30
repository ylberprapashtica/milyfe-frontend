import { ReactNode, ReactElement } from 'react';
import './CaptureForm.scss';

/**
 * Props for the CaptureForm component
 */
export interface CaptureFormProps {
  /** Form content (typically CaptureInput) */
  children: ReactNode;
  /** Error message to display */
  error?: string | null;
}

/**
 * Form wrapper component for capture creation
 * 
 * Provides a container for capture input forms and displays error messages.
 * This component handles the visual presentation of the form and error states.
 * 
 * @param {CaptureFormProps} props - Component props
 * @returns {ReactElement} The rendered form component
 * 
 * @example
 * ```tsx
 * <CaptureForm error={error}>
 *   <CaptureInput onSubmit={handleSubmit} disabled={loading} />
 * </CaptureForm>
 * ```
 */
export const CaptureForm = ({ children, error }: CaptureFormProps): ReactElement => {
  return (
    <div className="capture-form">
      {error && (
        <div className="capture-form-error" role="alert">
          {error}
        </div>
      )}
      {children}
    </div>
  );
};


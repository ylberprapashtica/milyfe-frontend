import { useState, KeyboardEvent, ChangeEvent, ReactElement } from 'react';
import './CaptureInput.scss';

/**
 * Props for the CaptureInput component
 */
export interface CaptureInputProps {
  /** Callback function when a capture is submitted */
  onSubmit: (thought: string) => Promise<void>;
  /** Whether the input should be disabled */
  disabled?: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
}

/**
 * Input component for creating new captures
 * 
 * Handles input state and Enter key submission. The component manages its own
 * internal state for the input value and calls the onSubmit callback when
 * the user presses Enter or clicks the submit button.
 * 
 * @param {CaptureInputProps} props - Component props
 * @returns {ReactElement} The rendered input component
 * 
 * @example
 * ```tsx
 * <CaptureInput
 *   onSubmit={async (thought) => {
 *     await createCapture(thought);
 *   }}
 *   disabled={loading}
 *   placeholder="Enter your thought..."
 * />
 * ```
 */
export const CaptureInput = ({
  onSubmit,
  disabled = false,
  placeholder = 'Enter your thought...',
}: CaptureInputProps): ReactElement => {
  const [thought, setThought] = useState<string>('');

  /**
   * Handle input value change
   */
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setThought(e.target.value);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (): Promise<void> => {
    if (!thought.trim() || disabled) {
      return;
    }

    try {
      await onSubmit(thought.trim());
      setThought('');
    } catch (err) {
      // Error handling is done by the parent component
      console.error('Error submitting capture:', err);
    }
  };

  /**
   * Handle keyboard events
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="capture-input-container">
      <input
        type="text"
        className="capture-input"
        placeholder={placeholder}
        value={thought}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <button
        className="capture-input-button"
        onClick={handleSubmit}
        disabled={!thought.trim() || disabled}
      >
        {disabled ? 'Saving...' : 'Capture'}
      </button>
    </div>
  );
};


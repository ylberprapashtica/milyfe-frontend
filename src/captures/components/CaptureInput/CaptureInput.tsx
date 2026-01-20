import { useState, KeyboardEvent, ChangeEvent, ReactElement } from 'react';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import './CaptureInput.scss';

/**
 * Props for the CaptureInput component
 */
export interface CaptureInputProps {
  /** Callback function when a capture is submitted */
  onSubmit: (content: string, title?: string, tags?: string[]) => Promise<void>;
  /** Whether the input should be disabled */
  disabled?: boolean;
  /** Placeholder text for the content textarea */
  placeholder?: string;
}

/**
 * Input component for creating new captures
 * 
 * Handles input state for title, content, and tags. The component manages its own
 * internal state and calls the onSubmit callback when the user submits the form.
 * Supports [[link]] syntax in the content field.
 * 
 * @param {CaptureInputProps} props - Component props
 * @returns {ReactElement} The rendered input component
 * 
 * @example
 * ```tsx
 * <CaptureInput
 *   onSubmit={async (content, title, tags) => {
 *     await createCapture(content, title, tags);
 *   }}
 *   disabled={loading}
 *   placeholder="Write your note here..."
 * />
 * ```
 */
export const CaptureInput = ({
  onSubmit,
  disabled = false,
  placeholder = 'Write your note here. Use [[double brackets]] to link to other notes...',
}: CaptureInputProps): ReactElement => {
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [tags, setTags] = useState<string>('');

  /**
   * Handle title input change
   */
  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setTitle(e.target.value);
  };

  /**
   * Handle content textarea change
   */
  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setContent(e.target.value);
  };

  /**
   * Handle tags input change
   */
  const handleTagsChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setTags(e.target.value);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (): Promise<void> => {
    if (!content.trim() || disabled) {
      return;
    }

    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await onSubmit(
        content.trim(),
        title.trim() || undefined,
        tagsArray.length > 0 ? tagsArray : undefined
      );
      
      // Reset form
      setTitle('');
      setContent('');
      setTags('');
    } catch (err) {
      // Error handling is done by the parent component
      console.error('Error submitting capture:', err);
    }
  };

  /**
   * Handle keyboard events in textarea (Ctrl/Cmd+Enter to submit)
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="capture-input-container">
      <Input
        id="capture-title"
        label="Title (optional)"
        type="text"
        placeholder="Note title (auto-extracted from first line if empty)"
        value={title}
        onChange={handleTitleChange}
        disabled={disabled}
      />

      <div className="capture-input-field">
        <Textarea
          id="capture-content"
          label="Content *"
          placeholder={placeholder}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={8}
        />
        <div className="capture-input-hint">
          Tip: Use [[Note Title]] to create links to other notes. Press Ctrl/Cmd+Enter to submit.
        </div>
      </div>

      <Input
        id="capture-tags"
        label="Tags (optional)"
        type="text"
        placeholder="tag1, tag2, tag3"
        value={tags}
        onChange={handleTagsChange}
        disabled={disabled}
      />

      <Button
        onClick={handleSubmit}
        disabled={!content.trim() || disabled}
        loading={disabled}
      >
        {disabled ? 'Saving...' : 'Create Note'}
      </Button>
    </div>
  );
};


import { useState, KeyboardEvent, ChangeEvent, ReactElement, useRef, useEffect } from 'react';
import { Input } from '@/common/components/ui/Input';
import { Textarea } from '@/common/components/ui/Textarea';
import { Button } from '@/common/components/ui/Button';
import { Autocomplete } from '@/common/components/ui/Autocomplete';
import { useCaptureAutocomplete } from '@/features/captures/hooks/useCaptureAutocomplete';
import { Capture } from '@/features/captures/types';
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
  /** Initial title value (for editing existing captures) */
  initialTitle?: string;
  /** Initial content value (for editing existing captures) */
  initialContent?: string;
  /** Initial tags value as comma-separated string (for editing existing captures) */
  initialTags?: string;
  /** Text to display on the submit button */
  submitButtonText?: string;
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
  initialTitle,
  initialContent,
  initialTags,
  submitButtonText = 'Create Note',
}: CaptureInputProps): ReactElement => {
  const [title, setTitle] = useState<string>(initialTitle || '');
  const [content, setContent] = useState<string>(initialContent || '');
  const [tags, setTags] = useState<string>(initialTags || '');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  
  // Update state when initial values change (e.g., when loading a different capture)
  useEffect(() => {
    if (initialTitle !== undefined) {
      setTitle(initialTitle);
    }
    if (initialContent !== undefined) {
      setContent(initialContent);
    }
    if (initialTags !== undefined) {
      setTags(initialTags);
    }
  }, [initialTitle, initialContent, initialTags]);
  
  // Autocomplete hook
  const {
    visible: autocompleteVisible,
    suggestions,
    query: autocompleteQuery,
    selectedIndex,
    position: autocompletePosition,
    handleChange: handleAutocompleteChange,
    handleKeyDown: handleAutocompleteKeyDown,
    getInsertion,
    close: closeAutocomplete,
  } = useCaptureAutocomplete();

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
    const newValue = e.target.value;
    setContent(newValue);
    
    // Handle autocomplete detection
    const cursorPosition = e.target.selectionStart;
    handleAutocompleteChange(newValue, cursorPosition, e.target);
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
      
      // Reset form only if not editing (no initial values)
      if (!initialContent) {
        setTitle('');
        setContent('');
        setTags('');
      }
    } catch (err) {
      // Error handling is done by the parent component
      console.error('Error submitting capture:', err);
    }
  };

  /**
   * Handle keyboard events in textarea (Ctrl/Cmd+Enter to submit, autocomplete navigation)
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    // Handle autocomplete keyboard events first
    const insertion = handleAutocompleteKeyDown(e, content, e.currentTarget.selectionStart);
    if (insertion) {
      // Autocomplete handled the event and returned insertion info
      setContent(insertion.newValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(insertion.cursorPosition, insertion.cursorPosition);
          textareaRef.current.focus();
        }
      }, 0);
      return;
    }
    
    // Handle Ctrl/Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  /**
   * Handle autocomplete selection
   */
  const handleAutocompleteSelect = (capture: Capture): void => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const insertion = getInsertion(capture, content, cursorPos);
    
    setContent(insertion.newValue);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(insertion.cursorPosition, insertion.cursorPosition);
        textareaRef.current.focus();
      }
    }, 0);
    
    closeAutocomplete();
  };

  return (
    <div className="capture-input-container">
      <div className="capture-input-field" style={{ position: 'relative' }}>
        <Textarea
          id="capture-content"
          label="Content *"
          placeholder={placeholder}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={8}
          ref={(el) => {
            textareaRef.current = el;
          }}
        />
        {autocompleteVisible && autocompletePosition && (
          <Autocomplete
            suggestions={suggestions}
            query={autocompleteQuery}
            selectedIndex={selectedIndex}
            onSelect={handleAutocompleteSelect}
            onClose={closeAutocomplete}
            position={autocompletePosition}
            visible={autocompleteVisible}
          />
        )}
        <div className="capture-input-hint">
          Tip: Use [[Note Title]] to create links to other notes.
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || disabled}
          loading={disabled}
        >
          {disabled ? 'Saving...' : submitButtonText}
        </Button>

        <Input
          id="capture-title"
          label="Title (optional)"
          type="text"
          placeholder="Leave empty for AI-generated title"
          value={title}
          onChange={handleTitleChange}
          disabled={disabled}
        />
        {!title && (
          <div className="capture-input-hint" style={{ marginTop: '-8px', marginBottom: '12px' }}>
            💡 AI will automatically generate a title if left empty
          </div>
        )}
      </div>

      <Input
        id="capture-tags"
        label="Tags (optional)"
        type="text"
        placeholder="Leave empty for AI-generated tags"
        value={tags}
        onChange={handleTagsChange}
        disabled={disabled}
      />
      {!tags && (
        <div className="capture-input-hint" style={{ marginTop: '-8px', marginBottom: '12px' }}>
          🤖 AI will automatically suggest relevant tags if left empty
        </div>
      )}
    </div>
  );
};


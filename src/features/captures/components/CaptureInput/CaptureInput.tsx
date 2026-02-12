import { useState, KeyboardEvent, ChangeEvent, ReactElement, useRef, useEffect } from 'react';
import { Input } from '@/common/components/ui/Input';
import { Textarea } from '@/common/components/ui/Textarea';
import { Select } from '@/common/components/ui/Select';
import { Autocomplete } from '@/common/components/ui/Autocomplete';
import { useCaptureAutocomplete } from '@/features/captures/hooks/useCaptureAutocomplete';
import { capturesService } from '@/features/captures/services/captures.service';
import { Capture, CaptureStatus, CaptureType } from '@/features/captures/types';
import { SketchCanvas } from '@/features/captures/components/SketchCanvas';
import type { SketchCanvasRef } from '@/features/captures/components/SketchCanvas';
import './CaptureInput.scss';

/**
 * Props for the CaptureInput component
 */
export interface CaptureInputProps {
  /** Callback function when a capture is submitted */
  onSubmit: (content: string, title?: string, tags?: string[], capture_type_id?: number | null, capture_status_id?: number | null, sketch_image?: string | null) => Promise<void>;
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
  /** Initial capture type ID (for editing existing captures) */
  initialCaptureTypeId?: number | null;
  /** Initial capture status ID (for editing existing captures) */
  initialCaptureStatusId?: number | null;
  /** Text to display on the submit button */
  submitButtonText?: string;
  /** Whether to hide the submit button (for external button placement) */
  hideSubmitButton?: boolean;
  /** Callback to get the submit handler function */
  onSubmitHandlerReady?: (handler: () => Promise<void>) => void;
  /** Callback to get the form validity state */
  onFormValidityChange?: (isValid: boolean) => void;
  /** Capture ID to track when editing different captures (resets form when changed) */
  captureId?: number;
  /** Initial sketch image (base64 data URL) for editing existing captures */
  initialSketchImage?: string | null;
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
  initialCaptureTypeId,
  initialCaptureStatusId,
  submitButtonText = 'Create Note',
  hideSubmitButton = false,
  onSubmitHandlerReady,
  onFormValidityChange,
  captureId,
  initialSketchImage,
}: CaptureInputProps): ReactElement => {
  const [title, setTitle] = useState<string>(initialTitle || '');
  const [content, setContent] = useState<string>(initialContent || '');
  const [tags, setTags] = useState<string>(initialTags || '');
  const [sketchImage, setSketchImage] = useState<string | null>(initialSketchImage || null);
  const [showSketchSection, setShowSketchSection] = useState<boolean>(false);
  const [captureTypeId, setCaptureTypeId] = useState<string>(initialCaptureTypeId?.toString() || '');
  const [captureStatusId, setCaptureStatusId] = useState<string>(initialCaptureStatusId?.toString() || '');
  const [captureTypes, setCaptureTypes] = useState<CaptureType[]>([]);
  const [captureStatuses, setCaptureStatuses] = useState<CaptureStatus[]>([]);
  const [loadingTypes, setLoadingTypes] = useState<boolean>(false);
  const [loadingStatuses, setLoadingStatuses] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sketchCanvasRef = useRef<SketchCanvasRef>(null);
  
  // Load capture types and statuses on mount
  useEffect(() => {
    const loadTypes = async (): Promise<void> => {
      try {
        setLoadingTypes(true);
        const types = await capturesService.getCaptureTypes();
        setCaptureTypes(types);
      } catch (err) {
        console.error('Error loading capture types:', err);
      } finally {
        setLoadingTypes(false);
      }
    };
    
    const loadStatuses = async (): Promise<void> => {
      try {
        setLoadingStatuses(true);
        const statuses = await capturesService.getCaptureStatuses();
        setCaptureStatuses(statuses);
        // Set default to 'fleeting' if no initial status is provided
        if (!initialCaptureStatusId && statuses.length > 0) {
          const fleetingStatus = statuses.find(s => s.name === 'fleeting');
          if (fleetingStatus) {
            setCaptureStatusId(fleetingStatus.id.toString());
          }
        }
      } catch (err) {
        console.error('Error loading capture statuses:', err);
      } finally {
        setLoadingStatuses(false);
      }
    };
    
    loadTypes();
    loadStatuses();
  }, [initialCaptureStatusId]);

  // Track the capture ID to reset form when editing a different capture
  const [lastCaptureId, setLastCaptureId] = useState<number | undefined>(captureId);
  
  // Update state when initial values change (e.g., when loading a different capture)
  // Reset form when capture ID changes, otherwise only initialize once
  useEffect(() => {
    const captureIdChanged = captureId !== undefined && captureId !== lastCaptureId;
    
    if (captureIdChanged || lastCaptureId === undefined) {
      if (initialTitle !== undefined) {
        setTitle(initialTitle);
      }
      if (initialContent !== undefined) {
        setContent(initialContent);
      }
      if (initialTags !== undefined) {
        setTags(initialTags);
      }
      if (initialCaptureTypeId !== undefined) {
        setCaptureTypeId(initialCaptureTypeId?.toString() || '');
      }
      if (initialCaptureStatusId !== undefined) {
        setCaptureStatusId(initialCaptureStatusId?.toString() || '');
      }
      if (initialSketchImage !== undefined) {
        setSketchImage(initialSketchImage || null);
      }
      if (captureIdChanged) {
        setLastCaptureId(captureId);
      } else if (lastCaptureId === undefined) {
        setLastCaptureId(captureId);
      }
    }
  }, [initialTitle, initialContent, initialTags, initialCaptureTypeId, initialCaptureStatusId, initialSketchImage, captureId, lastCaptureId]);
  
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
   * Handle capture type select change
   */
  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setCaptureTypeId(e.target.value);
  };

  /**
   * Handle status select change
   */
  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setCaptureStatusId(e.target.value);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (): Promise<void> => {
    if (!content.trim() || disabled) {
      return;
    }

    try {
      let sketchToSubmit = sketchImage;
      if (showSketchSection && sketchCanvasRef.current) {
        const exported = await sketchCanvasRef.current.exportImage();
        sketchToSubmit = exported || sketchImage;
        setSketchImage(sketchToSubmit);
        setShowSketchSection(false);
      }

      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const typeId = captureTypeId ? parseInt(captureTypeId, 10) : null;
      const statusId = captureStatusId ? parseInt(captureStatusId, 10) : null;
      await onSubmit(
        content.trim(),
        title.trim() || undefined,
        tagsArray.length > 0 ? tagsArray : undefined,
        typeId,
        statusId,
        sketchToSubmit || undefined
      );
      
      // Reset form only if not editing (no initial values)
      if (!initialContent) {
        setTitle('');
        setContent('');
        setTags('');
        setSketchImage(null);
        setCaptureTypeId('');
        // Reset to default 'fleeting' status
        const fleetingStatus = captureStatuses.find(s => s.name === 'fleeting');
        setCaptureStatusId(fleetingStatus?.id.toString() || '');
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

  // Expose submit handler and form validity to parent if requested
  // Update whenever form state changes to ensure latest values are used
  useEffect(() => {
    if (onSubmitHandlerReady) {
      onSubmitHandlerReady(handleSubmit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSubmitHandlerReady, content, title, tags, captureTypeId, captureStatusId, sketchImage, showSketchSection, disabled]);

  // Notify parent of form validity changes
  useEffect(() => {
    if (onFormValidityChange) {
      onFormValidityChange(content.trim().length > 0 && !disabled);
    }
  }, [content, disabled, onFormValidityChange]);

  return (
    <div className="capture-input-container">
      <div className="capture-input-field" style={{ position: 'relative' }}>
        <div className={`capture-input-content-slot ${showSketchSection ? 'capture-input-content-slot--sketch' : ''}`}>
          {!showSketchSection && (
            <>
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
            </>
          )}
          {showSketchSection && (
            <div className="capture-input-sketch-panel">
              <SketchCanvas
                ref={sketchCanvasRef}
                initialSketch={sketchImage}
                onClearSketch={() => setSketchImage(null)}
              />
            </div>
          )}
          <button
            type="button"
            className="capture-input-sketch-toggle"
            onClick={async () => {
              if (showSketchSection) {
                const dataUrl = await sketchCanvasRef.current?.exportImage();
                if (dataUrl) setSketchImage(dataUrl);
                setShowSketchSection(false);
              } else {
                setShowSketchSection(true);
              }
            }}
            disabled={disabled}
          >
            {showSketchSection ? '← Back to text' : '+ Add sketch'}
            {sketchImage && !showSketchSection && (
              <span className="capture-input-sketch-badge">1</span>
            )}
          </button>
        </div>

        <Select
        id="capture-type"
        label="Type (optional)"
        value={captureTypeId}
        onChange={handleTypeChange}
        disabled={disabled || loadingTypes}
        options={[
          { value: '', label: 'None' },
          ...captureTypes.map((type) => ({
            value: type.id.toString(),
            label: `${type.symbol} ${type.name.charAt(0).toUpperCase() + type.name.slice(1)}`,
          })),
        ]}
      />

        <Select
        id="capture-status"
        label="Status"
        value={captureStatusId}
        onChange={handleStatusChange}
        disabled={disabled || loadingStatuses}
        options={[
          ...captureStatuses.map((status) => ({
            value: status.id.toString(),
            label: status.name.charAt(0).toUpperCase() + status.name.slice(1),
          })),
        ]}
      />
      
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


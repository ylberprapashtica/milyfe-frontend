import { useState, KeyboardEvent, ChangeEvent, ReactElement, useRef, useEffect } from 'react';
import { Input } from '@/common/components/ui/Input';
import { Textarea } from '@/common/components/ui/Textarea';
import { Select } from '@/common/components/ui/Select';
import { Autocomplete } from '@/common/components/ui/Autocomplete';
import { TagsAutocomplete } from '@/features/captures/components/TagsAutocomplete';
import { ProjectAutocomplete, type ProjectSuggestion } from '@/features/projects/components/ProjectAutocomplete';
import { useCaptureAutocomplete } from '@/features/captures/hooks/useCaptureAutocomplete';
import {
  useCaptureTypes,
  useCaptureStatuses,
  useTags,
  useProjects,
} from '@/features/captures/contexts/ReferenceDataContext';
import { projectsService } from '@/features/projects/services/projects.service';
import { Capture } from '@/features/captures/types';
import { SketchCanvas } from '@/features/captures/components/SketchCanvas';
import type { SketchCanvasRef } from '@/features/captures/components/SketchCanvas';
import { VoiceRecorder } from '@/features/captures/components/VoiceRecorder';
import './CaptureInput.scss';

/**
 * Props for the CaptureInput component
 */
export interface CaptureInputProps {
  /** Callback function when a capture is submitted */
  onSubmit: (content: string, title?: string, tags?: string[], capture_type_id?: number | null, capture_status_id?: number | null, sketch_image?: string | null, voice_audio?: string | null, project_id?: number | null) => Promise<void>;
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
  /** Initial project ID (for editing existing captures) */
  initialProjectId?: number | null;
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
  /** Initial voice audio (base64 data URL) for editing existing captures */
  initialVoiceAudio?: string | null;
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
  initialProjectId,
  submitButtonText = 'Create Note',
  hideSubmitButton = false,
  onSubmitHandlerReady,
  onFormValidityChange,
  captureId,
  initialSketchImage,
  initialVoiceAudio,
}: CaptureInputProps): ReactElement => {
  const [title, setTitle] = useState<string>(initialTitle || '');
  const [content, setContent] = useState<string>(initialContent || '');
  const [tags, setTags] = useState<string>(initialTags || '');
  const [sketchImage, setSketchImage] = useState<string | null>(initialSketchImage || null);
  const [voiceAudio, setVoiceAudio] = useState<string | null>(initialVoiceAudio || null);
  const [showSketchSection, setShowSketchSection] = useState<boolean>(false);
  const [showVoiceSection, setShowVoiceSection] = useState<boolean>(false);
  const [captureTypeId, setCaptureTypeId] = useState<string>(initialCaptureTypeId?.toString() || '');
  const [captureStatusId, setCaptureStatusId] = useState<string>(initialCaptureStatusId?.toString() || '');
  const [projectId, setProjectId] = useState<string>(initialProjectId?.toString() || '');
  const [projectInputValue, setProjectInputValue] = useState<string>('');
  const { captureTypes, loading: loadingTypes } = useCaptureTypes();
  const { captureStatuses, loading: loadingStatuses } = useCaptureStatuses();
  const { tags: allTags } = useTags();
  const { projects, loading: loadingProjects, reloadProjects } = useProjects();
  const [projectSuggestions, setProjectSuggestions] = useState<ProjectSuggestion[]>([]);
  const [projectSuggestionsVisible, setProjectSuggestionsVisible] = useState<boolean>(false);
  const [projectSelectedIndex, setProjectSelectedIndex] = useState<number>(0);
  const [pendingNewProject, setPendingNewProject] = useState<{ name: string } | null>(null);
  const [projectDescription, setProjectDescription] = useState<string>('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [tagSuggestionsVisible, setTagSuggestionsVisible] = useState<boolean>(false);
  const [tagSelectedIndex, setTagSelectedIndex] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sketchCanvasRef = useRef<SketchCanvasRef>(null);
  const tagsWrapperRef = useRef<HTMLDivElement | null>(null);
  const projectWrapperRef = useRef<HTMLDivElement | null>(null);

  // Set default status to 'fleeting' once when statuses first load and no initial status provided
  const hasSetDefaultStatus = useRef(false);
  useEffect(() => {
    if (hasSetDefaultStatus.current || initialCaptureStatusId || captureStatuses.length === 0) return;
    const fleetingStatus = captureStatuses.find((s) => s.name === 'fleeting');
    if (fleetingStatus) {
      setCaptureStatusId(fleetingStatus.id.toString());
      hasSetDefaultStatus.current = true;
    }
  }, [initialCaptureStatusId, captureStatuses]);

  // Sync projectInputValue when projects load and we have projectId
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const proj = projects.find((p) => p.id.toString() === projectId);
      if (proj) {
        setProjectInputValue(proj.name);
      }
    }
  }, [projects, projectId]);

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
      if (initialProjectId !== undefined) {
        setProjectId(initialProjectId?.toString() || '');
        setProjectInputValue(''); // Will be synced when projects load
      }
      if (initialSketchImage !== undefined) {
        setSketchImage(initialSketchImage || null);
      }
      if (initialVoiceAudio !== undefined) {
        setVoiceAudio(initialVoiceAudio || null);
      }
      if (captureIdChanged) {
        setLastCaptureId(captureId);
      } else if (lastCaptureId === undefined) {
        setLastCaptureId(captureId);
      }
    }
  }, [initialTitle, initialContent, initialTags, initialCaptureTypeId, initialCaptureStatusId, initialProjectId, initialSketchImage, initialVoiceAudio, captureId, lastCaptureId]);
  
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
   * Get the current tag being typed (the part after the last comma)
   */
  const getCurrentTagQuery = (tagsValue: string): string => {
    const lastCommaIdx = tagsValue.lastIndexOf(',');
    const currentPart = lastCommaIdx >= 0 ? tagsValue.slice(lastCommaIdx + 1) : tagsValue;
    return currentPart.trim().toLowerCase();
  };

  /**
   * Get existing tags from the comma-separated value (to exclude from suggestions)
   */
  const getExistingTags = (tagsValue: string): string[] => {
    return tagsValue
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  };

  /**
   * Replace the current tag segment with the selected tag
   */
  const replaceCurrentTagWith = (tagsValue: string, selectedTag: string): string => {
    const lastCommaIdx = tagsValue.lastIndexOf(',');
    const before = lastCommaIdx >= 0 ? tagsValue.slice(0, lastCommaIdx + 1) : '';
    return (before + selectedTag).trim();
  };

  /**
   * Handle tags input change
   */
  const handleTagsChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value;
    setTags(newValue);

    const query = getCurrentTagQuery(newValue);
    const existingTags = getExistingTags(newValue);

    if (query.length > 0) {
      const filtered = allTags.filter(
        (tag) =>
          tag.toLowerCase().includes(query) && !existingTags.includes(tag.toLowerCase())
      );
      const exactMatch = filtered.some((tag) => tag.toLowerCase() === query);
      const createOption = !exactMatch && query.length > 0 ? [query] : [];
      const suggestionsList = [...filtered, ...createOption];
      setTagSuggestions(suggestionsList);
      setTagSuggestionsVisible(suggestionsList.length > 0);
      setTagSelectedIndex(0);
    } else {
      setTagSuggestionsVisible(false);
    }
  };

  /**
   * Handle tag suggestion select
   */
  const handleTagSelect = (selectedTag: string): void => {
    const newValue = replaceCurrentTagWith(tags, selectedTag);
    setTags(newValue);
    setTagSuggestionsVisible(false);
  };

  /**
   * Handle tags input keydown (ArrowUp, ArrowDown, Enter, Escape)
   */
  const handleTagsKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (!tagSuggestionsVisible || tagSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setTagSelectedIndex((prev) => (prev + 1) % tagSuggestions.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setTagSelectedIndex((prev) => (prev - 1 + tagSuggestions.length) % tagSuggestions.length);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTagSelect(tagSuggestions[tagSelectedIndex]);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setTagSuggestionsVisible(false);
    }
  };

  /**
   * Close tag suggestions when clicking outside
   */
  useEffect(() => {
    if (!tagSuggestionsVisible) return;
    const handleClickOutside = (e: MouseEvent): void => {
      if (tagsWrapperRef.current && !tagsWrapperRef.current.contains(e.target as Node)) {
        setTagSuggestionsVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [tagSuggestionsVisible]);

  /**
   * Close project suggestions when clicking outside
   */
  useEffect(() => {
    if (!projectSuggestionsVisible) return;
    const handleClickOutside = (e: MouseEvent): void => {
      if (projectWrapperRef.current && !projectWrapperRef.current.contains(e.target as Node)) {
        setProjectSuggestionsVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [projectSuggestionsVisible]);

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
   * Handle project input change (typing in autocomplete)
   */
  const handleProjectInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setProjectInputValue(value);
    setProjectId(''); // User is typing, clear selection
    setPendingNewProject(null); // User is changing, clear pending create
    const query = value.trim().toLowerCase();
    if (query.length > 0) {
      const filtered = projects.filter((p) => p.name.toLowerCase().includes(query));
      const exactMatch = filtered.some((p) => p.name.toLowerCase() === query);
      const createOption: ProjectSuggestion[] = !exactMatch ? [{ name: value.trim(), isCreate: true }] : [];
      setProjectSuggestions([...filtered, ...createOption]);
      setProjectSuggestionsVisible(filtered.length > 0 || createOption.length > 0);
      setProjectSelectedIndex(0);
    } else {
      const noProjectOption: ProjectSuggestion = { name: 'No project', isNoProject: true };
      setProjectSuggestions([noProjectOption, ...projects]);
      setProjectSuggestionsVisible(true);
      setProjectSelectedIndex(0);
    }
  };

  /**
   * Handle project input focus - show all projects when focused with empty input
   */
  const handleProjectFocus = (): void => {
    if (projectInputValue.trim().length === 0) {
      const noProjectOption: ProjectSuggestion = { name: 'No project', isNoProject: true };
      setProjectSuggestions([noProjectOption, ...projects]);
      setProjectSuggestionsVisible(true);
      setProjectSelectedIndex(0);
    }
  };

  /**
   * Handle project suggestion select
   */
  const handleProjectSelect = async (suggestion: ProjectSuggestion): Promise<void> => {
    if ('isCreate' in suggestion && suggestion.isCreate) {
      setPendingNewProject({ name: suggestion.name });
      setProjectInputValue(suggestion.name);
      setProjectDescription('');
    } else if ('isNoProject' in suggestion && suggestion.isNoProject) {
      setProjectId('');
      setProjectInputValue('');
      setPendingNewProject(null);
      setProjectDescription('');
    } else if ('id' in suggestion) {
      setProjectId(suggestion.id.toString());
      setProjectInputValue(suggestion.name);
      setPendingNewProject(null);
      setProjectDescription('');
    }
    setProjectSuggestionsVisible(false);
  };

  /**
   * Handle project input keydown (ArrowUp, ArrowDown, Enter, Escape)
   */
  const handleProjectKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (!projectSuggestionsVisible || projectSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setProjectSelectedIndex((prev) => (prev + 1) % projectSuggestions.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setProjectSelectedIndex((prev) => (prev - 1 + projectSuggestions.length) % projectSuggestions.length);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleProjectSelect(projectSuggestions[projectSelectedIndex]);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setProjectSuggestionsVisible(false);
    }
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
      let projId: number | null = projectId ? parseInt(projectId, 10) : null;

      // If user selected to create a new project, create it first
      if (pendingNewProject) {
        try {
          const created = await projectsService.createProject(pendingNewProject.name, projectDescription.trim() || null);
          projId = created.id;
          reloadProjects();
          setProjectId(created.id.toString());
          setPendingNewProject(null);
          setProjectDescription('');
        } catch (err) {
          console.error('Error creating project:', err);
          return;
        }
      }

      await onSubmit(
        content.trim(),
        title.trim() || undefined,
        tagsArray.length > 0 ? tagsArray : undefined,
        typeId,
        statusId,
        sketchToSubmit || undefined,
        voiceAudio || undefined,
        projId
      );
      
      // Reset form only if not editing (no initial values)
      if (!initialContent) {
        setTitle('');
        setContent('');
        setTags('');
        setSketchImage(null);
        setVoiceAudio(null);
        setCaptureTypeId('');
        // Reset to default 'fleeting' status
        const fleetingStatus = captureStatuses.find(s => s.name === 'fleeting');
        setCaptureStatusId(fleetingStatus?.id.toString() || '');
        setProjectId('');
        setProjectInputValue('');
        setPendingNewProject(null);
        setProjectDescription('');
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
  }, [onSubmitHandlerReady, content, title, tags, captureTypeId, captureStatusId, projectId, sketchImage, voiceAudio, showSketchSection, showVoiceSection, disabled, pendingNewProject, projectDescription]);

  // Notify parent of form validity changes
  useEffect(() => {
    if (onFormValidityChange) {
      onFormValidityChange(content.trim().length > 0 && !disabled);
    }
  }, [content, disabled, onFormValidityChange]);

  return (
    <div className="capture-input-container">
      <div className="capture-input-field" style={{ position: 'relative' }}>
        <div className={`capture-input-content-slot ${showSketchSection ? 'capture-input-content-slot--sketch' : ''} ${showVoiceSection ? 'capture-input-content-slot--voice' : ''}`}>
          <div className="capture-input-toolbar">
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
                  setShowVoiceSection(false);
                }
              }}
              disabled={disabled}
            >
              {showSketchSection ? '← Back to text' : '+ Add sketch'}
              {sketchImage && !showSketchSection && (
                <span className="capture-input-sketch-badge">1</span>
              )}
            </button>
            <button
              type="button"
              className="capture-input-voice-toggle"
              onClick={() => {
                if (showVoiceSection) {
                  setShowVoiceSection(false);
                } else {
                  setShowVoiceSection(true);
                  setShowSketchSection(false);
                }
              }}
              disabled={disabled}
            >
              {showVoiceSection ? '← Back to text' : '+ Add voice'}
              {voiceAudio && !showVoiceSection && (
                <span className="capture-input-voice-badge">1</span>
              )}
            </button>
          </div>
          {!showSketchSection && !showVoiceSection && (
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
          {showVoiceSection && (
            <div className="capture-input-voice-panel">
              <VoiceRecorder
                initialVoiceAudio={voiceAudio}
                onAccept={(base64DataUrl) => {
                  setVoiceAudio(base64DataUrl);
                  setShowVoiceSection(false);
                }}
                onDiscard={() => {
                  setVoiceAudio(null);
                  setShowVoiceSection(false);
                }}
                onTranscribeToContent={(transcript) => {
                  setContent((prev) => (prev.trim() ? `${prev}\n\n${transcript}` : transcript));
                }}
                disabled={disabled}
              />
            </div>
          )}
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

        <div ref={projectWrapperRef} className="capture-input-project-wrapper">
          <Input
            id="capture-project"
            label="Project (optional)"
            type="text"
            placeholder="Type to search or create a project..."
            value={projectInputValue}
            onChange={handleProjectInputChange}
            onFocus={handleProjectFocus}
            onKeyDown={handleProjectKeyDown}
            disabled={disabled || loadingProjects}
          />
          <ProjectAutocomplete
            suggestions={projectSuggestions}
            selectedIndex={projectSelectedIndex}
            onSelect={handleProjectSelect}
            onClose={() => setProjectSuggestionsVisible(false)}
            visible={projectSuggestionsVisible}
          />
          {pendingNewProject && (
            <Textarea
              id="capture-project-description"
              label="Project description (optional)"
              placeholder="Describe this project..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              disabled={disabled}
              rows={3}
            />
          )}
        </div>
      
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

        <div ref={tagsWrapperRef} className="capture-input-tags-wrapper">
          <Input
            id="capture-tags"
            label="Tags (optional)"
            type="text"
            placeholder="e.g. work, project, idea (comma-separated)"
            value={tags}
            onChange={handleTagsChange}
            onKeyDown={handleTagsKeyDown}
            disabled={disabled}
          />
          <TagsAutocomplete
            suggestions={tagSuggestions}
            selectedIndex={tagSelectedIndex}
            onSelect={handleTagSelect}
            onClose={() => setTagSuggestionsVisible(false)}
            visible={tagSuggestionsVisible}
          />
        </div>
        {!tags && (
          <div className="capture-input-hint" style={{ marginTop: '-8px', marginBottom: '12px' }}>
            Add tags separated by commas. AI can only suggest from tags you have already created.
          </div>
        )}
      </div>
    </div>
  );
};


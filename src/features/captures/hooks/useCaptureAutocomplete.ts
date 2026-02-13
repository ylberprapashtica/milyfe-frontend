import { useState, useEffect, useCallback, useRef } from 'react';
import { capturesService } from '@/features/captures/services/captures.service';
import { Capture } from '@/features/captures/types';

/**
 * Position information for autocomplete dropdown
 */
export interface AutocompletePosition {
  top: number;
  left: number;
}

/**
 * Insertion information returned when a capture is selected
 */
export interface CaptureInsertion {
  /** New value for the textarea */
  newValue: string;
  /** New cursor position */
  cursorPosition: number;
}

/**
 * Return type for the useCaptureAutocomplete hook
 */
export interface UseCaptureAutocompleteReturn {
  /** Whether autocomplete should be visible */
  visible: boolean;
  /** Array of matching capture suggestions */
  suggestions: Capture[];
  /** Current query string after [[ */
  query: string;
  /** Index of currently selected suggestion */
  selectedIndex: number;
  /** Position where dropdown should appear */
  position: AutocompletePosition | null;
  /** Whether a search is in progress */
  loading: boolean;
  /** Handle textarea change to detect [[ triggers */
  handleChange: (value: string, cursorPosition: number, textareaElement: HTMLTextAreaElement | null) => void;
  /** Handle keyboard events for navigation - returns insertion info if Enter is pressed */
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>, currentValue: string, cursorPosition: number) => CaptureInsertion | null;
  /** Get insertion info for a selected capture */
  getInsertion: (capture: Capture, currentValue: string, cursorPosition: number) => CaptureInsertion;
  /** Close the autocomplete */
  close: () => void;
  /** Get the text to insert when a capture is selected */
  getInsertText: (capture: Capture) => string;
}

/**
 * Debounce utility function
 */
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Calculate cursor position in textarea to determine dropdown position
 * Returns position relative to the textarea's container (not viewport)
 */
const calculateCursorPosition = (
  textarea: HTMLTextAreaElement,
  cursorPos: number
): { top: number; left: number } => {
  // Find the container with position: relative (the capture-input-field div)
  let container: HTMLElement | null = textarea.parentElement;
  while (container && getComputedStyle(container).position === 'static') {
    container = container.parentElement;
  }
  
  // If no relative container found, use the textarea wrapper or closest relative parent
  if (!container || getComputedStyle(container).position !== 'relative') {
    container = textarea.closest('.capture-input-field') || textarea.parentElement;
  }

  if (!container) {
    // Fallback: position relative to textarea itself
    return { top: 40, left: 20 };
  }

  const containerRect = container.getBoundingClientRect();
  const textareaRect = textarea.getBoundingClientRect();
  
  // Calculate position relative to container
  const style = getComputedStyle(textarea);
  const lineHeight = parseInt(style.lineHeight, 10) || parseInt(style.fontSize, 10) * 1.2;
  const paddingTop = parseInt(style.paddingTop, 10) || 16;
  const paddingLeft = parseInt(style.paddingLeft, 10) || 20;
  
  // Get text before cursor to calculate line number
  const textBeforeCursor = textarea.value.substring(0, cursorPos);
  const lines = textBeforeCursor.split('\n');
  const currentLine = lines.length - 1;
  const currentLineText = lines[currentLine] || '';
  
  // Measure actual text width using a canvas or span
  const measureText = (text: string, font: string): number => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      context.font = font;
      return context.measureText(text).width;
    }
    // Fallback: estimate based on character count
    const fontSize = parseInt(style.fontSize, 10) || 16;
    return text.length * fontSize * 0.6;
  };
  
  const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const textWidth = measureText(currentLineText, font);
  
  // Calculate vertical position
  const textareaTopRelative = textareaRect.top - containerRect.top;
  const lineOffset = currentLine * lineHeight;
  const scrollOffset = textarea.scrollTop;
  
  // Position below the current line
  const top = textareaTopRelative + paddingTop + lineOffset - scrollOffset + lineHeight;
  const left = textareaRect.left - containerRect.left + paddingLeft + textWidth;

  return { top, left };
};

/**
 * Find the [[ trigger and extract query
 */
const findTrigger = (value: string, cursorPos: number): { start: number; query: string } | null => {
  // Find the last [[ before cursor
  const textBeforeCursor = value.substring(0, cursorPos);
  const lastOpenBracket = textBeforeCursor.lastIndexOf('[[');
  
  if (lastOpenBracket === -1) {
    return null;
  }

  // Check if there's a closing ]] before cursor (if so, this is a completed link)
  const textAfterOpen = textBeforeCursor.substring(lastOpenBracket + 2);
  const closeBracket = textAfterOpen.indexOf(']]');
  
  if (closeBracket !== -1) {
    // There's a closing bracket, so this is a completed link
    return null;
  }

  // Extract query (text between [[ and cursor)
  const query = textAfterOpen.trim();
  
  return {
    start: lastOpenBracket,
    query,
  };
};

/**
 * Custom hook for capture autocomplete functionality
 * 
 * Detects when [[ is typed in a textarea and provides autocomplete suggestions
 * for existing captures. Handles keyboard navigation and selection.
 * 
 * @returns {UseCaptureAutocompleteReturn} Autocomplete state and handlers
 * 
 * @example
 * ```tsx
 * const {
 *   visible,
 *   suggestions,
 *   query,
 *   selectedIndex,
 *   position,
 *   handleChange,
 *   handleKeyDown,
 *   selectCapture,
 *   close,
 * } = useCaptureAutocomplete();
 * 
 * <Textarea
 *   value={content}
 *   onChange={(e) => {
 *     setContent(e.target.value);
 *     handleChange(e.target.value, e.target.selectionStart, e.target);
 *   }}
 *   onKeyDown={handleKeyDown}
 * />
 * ```
 */
export const useCaptureAutocomplete = (): UseCaptureAutocompleteReturn => {
  const [visible, setVisible] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<Capture[]>([]);
  const [query, setQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [position, setPosition] = useState<AutocompletePosition | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [triggerStart, setTriggerStart] = useState<number>(-1);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /**
   * Search for matching captures. Only fetches when user has typed at least one letter after [[
   */
  const searchCaptures = useCallback(async (searchQuery: string): Promise<void> => {
    if (!searchQuery.trim()) {
      // Don't fetch until user types at least one letter
      setSuggestions([]);
      setSelectedIndex(0);
      return;
    }

    try {
      setLoading(true);
      const results = await capturesService.searchCaptures(searchQuery);
      // Limit to first 10 results
      setSuggestions(results.slice(0, 10));
      setSelectedIndex(0);
    } catch (err) {
      console.error('Error searching captures:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Debounced search function
   */
  const debouncedSearch = useRef(
    debounce((searchQuery: string) => {
      searchCaptures(searchQuery);
    }, 300)
  ).current;

  /**
   * Handle textarea value change
   */
  const handleChange = useCallback((
    value: string,
    cursorPosition: number,
    textareaElement: HTMLTextAreaElement | null
  ): void => {
    textareaRef.current = textareaElement;
    
    const trigger = findTrigger(value, cursorPosition);
    
    if (!trigger) {
      setVisible(false);
      setQuery('');
      setTriggerStart(-1);
      return;
    }

    // Show autocomplete
    setVisible(true);
    setQuery(trigger.query);
    setTriggerStart(trigger.start);

    // Calculate dropdown position
    if (textareaElement) {
      const pos = calculateCursorPosition(textareaElement, cursorPosition);
      setPosition(pos);
    }

    // Search for matching captures
    debouncedSearch(trigger.query);
  }, [debouncedSearch]);

  /**
   * Get text to insert when a capture is selected
   */
  const getInsertText = useCallback((capture: Capture): string => {
    const title = capture.title || capture.content.split('\n')[0]?.substring(0, 100) || 'Untitled';
    return `[[${title}]]`;
  }, []);

  /**
   * Close autocomplete
   */
  const close = useCallback((): void => {
    setVisible(false);
    setQuery('');
    setSuggestions([]);
    setSelectedIndex(0);
    setPosition(null);
    setTriggerStart(-1);
  }, []);

  /**
   * Get insertion information for a capture
   */
  const getInsertion = useCallback((
    capture: Capture,
    currentValue: string,
    cursorPosition: number
  ): CaptureInsertion => {
    const insertText = getInsertText(capture);
    const beforeTrigger = currentValue.substring(0, triggerStart);
    const afterCursor = currentValue.substring(cursorPosition);
    const newValue = `${beforeTrigger}${insertText}${afterCursor}`;
    const newCursorPos = beforeTrigger.length + insertText.length;
    
    return {
      newValue,
      cursorPosition: newCursorPos,
    };
  }, [triggerStart, getInsertText]);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    currentValue: string,
    cursorPosition: number
  ): CaptureInsertion | null => {
    if (!visible) {
      return null;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        return null;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        return null;

      case 'Enter':
        if (suggestions.length > 0 && selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          const selected = suggestions[selectedIndex];
          const insertion = getInsertion(selected, currentValue, cursorPosition);
          close();
          return insertion;
        }
        return null;

      case 'Escape':
        e.preventDefault();
        close();
        return null;

      default:
        return null;
    }
  }, [visible, suggestions, selectedIndex, getInsertion, close]);

  return {
    visible,
    suggestions,
    query,
    selectedIndex,
    position,
    loading,
    handleChange,
    handleKeyDown,
    getInsertion,
    close,
    getInsertText,
  };
};

import React, { ReactNode } from 'react';

/**
 * Parse [[link]] patterns from content
 * 
 * @param content - The content string to parse
 * @returns Array of link titles found in content
 * 
 * @example
 * ```ts
 * const links = parseLinks('This relates to [[Another Note]] and [[Yet Another]]');
 * // Returns: ['Another Note', 'Yet Another']
 * ```
 */
export function parseLinks(content: string): string[] {
  const links: string[] = [];
  const pattern = /\[\[([^\]]+)\]\]/g;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    links.push(match[1].trim());
  }

  // Remove duplicates using Array.from instead of spread
  return Array.from(new Set(links));
}

/**
 * Render content with [[links]] converted to clickable elements
 * 
 * @param content - The content string to render
 * @param onLinkClick - Callback function when a link is clicked (receives the link title)
 * @returns ReactNode with links rendered as clickable elements
 * 
 * @example
 * ```tsx
 * const handleLinkClick = (title: string) => {
 *   navigate(`/captures/${title}`);
 * };
 * 
 * return (
 *   <div>{renderLinks('Check out [[My Note]]', handleLinkClick)}</div>
 * );
 * ```
 */
export function renderLinks(
  content: string,
  onLinkClick: (linkTitle: string) => void
): ReactNode {
  const parts: ReactNode[] = [];
  const pattern = /\[\[([^\]]+)\]\]/g;
  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  while ((match = pattern.exec(content)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    // Add the clickable link
    const linkTitle = match[1].trim();
    const currentKey = keyCounter++;
    parts.push(
      <button
        key={currentKey}
        type="button"
        onClick={() => onLinkClick(linkTitle)}
        className="note-link"
        style={{
          background: 'none',
          border: 'none',
          color: '#0066cc',
          textDecoration: 'underline',
          cursor: 'pointer',
          padding: 0,
          font: 'inherit',
        }}
      >
        {linkTitle}
      </button>
    );

    lastIndex = pattern.lastIndex;
  }

  // Add remaining text after the last link
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  // If no links were found, return the original content
  if (parts.length === 0) {
    return content;
  }

  return <>{parts}</>;
}

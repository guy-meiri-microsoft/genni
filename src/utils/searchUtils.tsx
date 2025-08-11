import React from 'react';

export interface SearchMatch {
  start: number;
  end: number;
  text: string;
}

export function findMatches(text: string, searchTerm: string): SearchMatch[] {
  if (!searchTerm || !text) return [];
  
  const matches: SearchMatch[] = [];
  const lowerText = text.toLowerCase();
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  let index = 0;
  while ((index = lowerText.indexOf(lowerSearchTerm, index)) !== -1) {
    matches.push({
      start: index,
      end: index + searchTerm.length,
      text: text.substring(index, index + searchTerm.length)
    });
    index += searchTerm.length;
  }
  
  return matches;
}

export function highlightMatches(
  text: string, 
  matches: SearchMatch[], 
  currentMatchIndex: number = -1
): React.ReactNode[] {
  if (matches.length === 0) return [text];
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  matches.forEach((match, index) => {
    // Add text before the match
    if (match.start > lastIndex) {
      parts.push(text.substring(lastIndex, match.start));
    }
    
    // Add the highlighted match
    const isCurrentMatch = index === currentMatchIndex;
    parts.push(
      <span 
        key={`match-${index}`}
        className={`search-highlight ${isCurrentMatch ? 'current-match' : ''}`}
      >
        {match.text}
      </span>
    );
    
    lastIndex = match.end;
  });
  
  // Add remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts;
}

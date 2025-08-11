import { useState, useEffect, useRef } from 'react';
import { formatJson } from '../utils/chrome';
import { JsonSearch } from './JsonSearch';
import { findMatches } from '../utils/searchUtils';
import type { SearchMatch } from '../utils/searchUtils';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isValid: boolean;
  error?: string;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  isValid,
  error
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalValue] = useState(value);
  
  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isNavigatingMatches, setIsNavigatingMatches] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync localValue with incoming value only if we haven't made changes yet
  useEffect(() => {
    if (!hasChanges) {
      setLocalValue(value);
    }
  }, [value, hasChanges]);

  useEffect(() => {
    const newHasChanges = localValue !== originalValue;
    setHasChanges(newHasChanges);
  }, [localValue, originalValue]);

  // Update search matches when search term or content changes
  useEffect(() => {
    if (searchTerm) {
      const matches = findMatches(localValue, searchTerm);
      setSearchMatches(matches);
      setCurrentMatchIndex(0);
    } else {
      setSearchMatches([]);
      setCurrentMatchIndex(0);
    }
  }, [searchTerm, localValue]);

  // Scroll to current match only when actively navigating
  useEffect(() => {
    if (searchMatches.length > 0 && textareaRef.current && isNavigatingMatches) {
      const match = searchMatches[currentMatchIndex];
      const textarea = textareaRef.current;
      
      // Set cursor position to the match
      textarea.focus();
      textarea.setSelectionRange(match.start, match.end);
      
      // Scroll to make the selection visible
      const lines = localValue.substring(0, match.start).split('\n');
      const lineNumber = lines.length - 1;
      const lineHeight = 20; // Approximate line height
      const scrollTop = lineNumber * lineHeight - textarea.clientHeight / 2;
      textarea.scrollTop = Math.max(0, scrollTop);
      
      // Reset navigation flag
      setIsNavigatingMatches(false);
    }
  }, [currentMatchIndex, searchMatches, localValue, isNavigatingMatches]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleFormat = () => {
    try {
      const formatted = formatJson(localValue);
      setLocalValue(formatted);
      onChange(formatted);
    } catch (e) {
      console.warn('Failed to format JSON:', e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 's') {
        e.preventDefault();
        if (hasChanges && isValid) {
          onSave();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (showSearch) {
          setShowSearch(false);
          setSearchTerm('');
        } else {
          onCancel();
        }
      } else if (e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
      }
    } else if (e.key === 'F3') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePreviousMatch();
      } else {
        handleNextMatch();
      }
    }
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleNextMatch = () => {
    if (searchMatches.length > 0) {
      setIsNavigatingMatches(true);
      setCurrentMatchIndex((prev) => (prev + 1) % searchMatches.length);
    }
  };

  const handlePreviousMatch = () => {
    if (searchMatches.length > 0) {
      setIsNavigatingMatches(true);
      setCurrentMatchIndex((prev) => (prev - 1 + searchMatches.length) % searchMatches.length);
    }
  };

  const handleCloseSearch = () => {
    setShowSearch(false);
    setSearchTerm('');
    textareaRef.current?.focus();
  };

  return (
    <div className="json-editor">
      <div className="editor-header">
        <div className="status">
          {isValid ? (
            <span className="status-valid">✓ Valid JSON</span>
          ) : (
            <span className="status-invalid">✗ Invalid JSON</span>
          )}
          {error && <span className="error-message">: {error}</span>}
        </div>
        <div className="editor-controls">
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="search-btn"
            title="Search in JSON (Ctrl/Cmd + F)"
          >
            🔍
          </button>
          <button 
            onClick={handleFormat}
            disabled={!isValid}
            className="format-btn"
            title="Format JSON"
          >
            Format
          </button>
        </div>
      </div>

      <JsonSearch
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        currentMatch={currentMatchIndex}
        totalMatches={searchMatches.length}
        onPrevious={handlePreviousMatch}
        onNext={handleNextMatch}
        isVisible={showSearch}
        onClose={handleCloseSearch}
      />
      
      <div className="editor-content">
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`json-textarea ${!isValid ? 'invalid' : ''}`}
          rows={8}
          placeholder="Enter JSON here..."
          spellCheck={false}
          autoFocus
        />
      </div>
      
      <div className="editor-footer">
        <div className="keyboard-shortcuts">
          <small>
            Ctrl/Cmd + S to save • Ctrl/Cmd + F to search • F3/Shift+F3 to navigate • Escape to cancel
          </small>
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';

interface JsonSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  currentMatch: number;
  totalMatches: number;
  onPrevious: () => void;
  onNext: () => void;
  isVisible: boolean;
  onClose: () => void;
}

export const JsonSearch: React.FC<JsonSearchProps> = ({
  searchTerm,
  onSearchChange,
  currentMatch,
  totalMatches,
  onPrevious,
  onNext,
  isVisible,
  onClose
}) => {
  const [inputValue, setInputValue] = useState(searchTerm);

  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    onSearchChange(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevious();
      } else {
        onNext();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="json-search">
      <div className="search-input-container">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search in JSON..."
          className="search-input"
          autoFocus
        />
        <div className="search-results">
          {searchTerm && (
            <span className="match-count">
              {totalMatches > 0 ? `${currentMatch + 1} of ${totalMatches}` : 'No matches'}
            </span>
          )}
        </div>
      </div>
      
      <div className="search-controls">
        <button
          onClick={onPrevious}
          disabled={totalMatches === 0}
          className="search-btn"
          title="Previous match (Shift + Enter)"
        >
          ↑
        </button>
        <button
          onClick={onNext}
          disabled={totalMatches === 0}
          className="search-btn"
          title="Next match (Enter)"
        >
          ↓
        </button>
        <button
          onClick={onClose}
          className="search-btn close-btn"
          title="Close search (Escape)"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

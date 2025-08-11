import { useState, useEffect, useRef } from 'react';
import type { LocalStorageItem } from '../types';
import { JsonEditor } from './JsonEditor';

interface LocalStorageItemComponentProps {
  item: LocalStorageItem;
  onUpdate: (key: string, newValue: string) => Promise<void>;
  autoExpand?: boolean;
  searchTerm?: string;
  isFirstResult?: boolean;
}

export const LocalStorageItemComponent: React.FC<LocalStorageItemComponentProps> = ({
  item,
  onUpdate,
  autoExpand = false,
  searchTerm = '',
  isFirstResult = false
}) => {
  const [isExpanded, setIsExpanded] = useState(autoExpand || false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.value);
  const [editError, setEditError] = useState<string | undefined>();
  const [isValidJson, setIsValidJson] = useState(item.isValidJson);
  const [isSaving, setIsSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Sync editValue when item.value changes (after successful save)
  useEffect(() => {
    setEditValue(item.value);
    setIsValidJson(item.isValidJson);
    setEditError(item.error);
  }, [item.value, item.isValidJson, item.error]);

  // Handle auto-expand from search
  useEffect(() => {
    if (autoExpand) {
      setIsExpanded(true);
    }
  }, [autoExpand]);

  // Scroll to top when this is the first search result
  useEffect(() => {
    if (isFirstResult && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }, [isFirstResult]);

  // Helper function to highlight search terms
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.split(regex).map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="search-highlight">{part}</mark>
      ) : part
    );
  };

  const handleEditChange = (newValue: string) => {
    setEditValue(newValue);
    
    try {
      JSON.parse(newValue);
      setIsValidJson(true);
      setEditError(undefined);
    } catch (e) {
      setIsValidJson(false);
      setEditError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  const handleSave = async () => {
    if (!isValidJson) return;
    
    setIsSaving(true);
    try {
      await onUpdate(item.key, editValue);
      setIsEditing(false);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(item.value);
    setEditError(undefined);
    setIsValidJson(item.isValidJson);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    // Reset edit state to current item values
    setEditValue(item.value);
    setIsValidJson(item.isValidJson);
    setEditError(item.error);
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const displayValue = () => {
    if (item.isValidJson && item.parsedValue) {
      return JSON.stringify(item.parsedValue, null, 2);
    }
    return item.value;
  };

  const renderKeyDisplay = () => {
    if (item.mockParts) {
      const { api, startDate, endDate, id } = item.mockParts;
      return (
        <div className="mock-key-parts">
          <div className="key-info-inline">
            <span className="api-name">{highlightText(api, searchTerm)}</span>
            {startDate && endDate && (
              <>
                <span className="separator">•</span>
                <span className="date-range">{startDate} → {endDate}</span>
              </>
            )}
            {id && (
              <>
                <span className="separator">•</span>
                <span className="mock-id" title={id}>{id.substring(0, 8)}...</span>
              </>
            )}
          </div>
        </div>
      );
    }
    
    // Fallback for non-mock keys or unparseable keys
    return (
      <div className="simple-key">
        <span className="value">{highlightText(item.key, searchTerm)}</span>
      </div>
    );
  };

  return (
    <div className="storage-item" ref={cardRef}>
      <div className="item-header" onClick={toggleExpanded}>
        <div className="item-title">
          <h3 className="item-key">
            {item.mockParts ? highlightText(item.mockParts.api, searchTerm) : highlightText(item.key, searchTerm)}
            {item.mockParts?.startDate && item.mockParts?.endDate && (
              <span className="date-preview">
                <small> ({item.mockParts.startDate} → {item.mockParts.endDate})</small>
              </span>
            )}
          </h3>
          <div className="item-status">
            {item.isValidJson ? (
              <span className="status-valid">JSON</span>
            ) : (
              <span className="status-invalid" title={item.error}>
                Invalid JSON
              </span>
            )}
          </div>
        </div>
        <div className="item-controls">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleStartEdit();
            }}
            className="edit-btn"
            title="Edit JSON"
          >
            ✏️
          </button>
          <button 
            className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded();
            }}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="item-content">
          {isEditing ? (
            <div className="edit-mode">
              <JsonEditor
                value={editValue}
                onChange={handleEditChange}
                onSave={handleSave}
                onCancel={handleCancel}
                isValid={isValidJson}
                error={editError}
              />
            </div>
          ) : (
            <div className="view-mode">
              <div className="key-details">
                {renderKeyDisplay()}
              </div>
              <pre className="json-display">{displayValue()}</pre>
            </div>
          )}
        </div>
      )}

      {isSaving && (
        <div className="saving-indicator">
          Saving...
        </div>
      )}
    </div>
  );
};

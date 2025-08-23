import { useState, useEffect, useRef } from 'react';
import { SimpleJsonEditor } from './SimpleJsonEditor';

interface BaseItemProps {
  itemKey: string;
  itemValue: string;
  isValidJson: boolean;
  error?: string;
  onUpdate: (key: string, newValue: string) => Promise<void>;
  onDelete: (key: string) => Promise<void>;
  autoExpand?: boolean;
  searchTerm?: string;
  isFirstResult?: boolean;
  children: {
    renderTitle: () => React.ReactNode;
    renderKeyDisplay: () => React.ReactNode;
    renderActionButtons?: () => React.ReactNode;
  };
}

export const BaseItemComponent: React.FC<BaseItemProps> = ({
  itemKey,
  itemValue,
  isValidJson: initialIsValidJson,
  error: initialError,
  onUpdate,
  onDelete,
  autoExpand = false,
  isFirstResult = false,
  children
}) => {
  const [isExpanded, setIsExpanded] = useState(autoExpand || false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(itemValue);
  const [editError, setEditError] = useState<string | undefined>(initialError);
  const [isValidJson, setIsValidJson] = useState(initialIsValidJson);
  const [isSaving, setIsSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Sync editValue when itemValue changes (after successful save)
  useEffect(() => {
    setEditValue(itemValue);
    setIsValidJson(initialIsValidJson);
    setEditError(initialError);
  }, [itemValue, initialIsValidJson, initialError]);

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
      await onUpdate(itemKey, editValue);
      setIsEditing(false);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(itemValue);
    setEditError(initialError);
    setIsValidJson(initialIsValidJson);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    const confirmMessage = `Are you sure you want to delete "${itemKey}"?\n\nThis action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await onDelete(itemKey);
    } catch (error) {
      alert(`Failed to delete item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleStartEdit = () => {
    console.log('🔍 BaseItem: Starting edit for key:', itemKey);
    
    setIsEditing(true);
    // Reset edit state to current item values
    setEditValue(itemValue);
    setIsValidJson(initialIsValidJson);
    setEditError(initialError);
    
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const displayValue = () => {
    if (initialIsValidJson) {
      try {
        const parsed = JSON.parse(itemValue);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return itemValue;
      }
    }
    return itemValue;
  };

  return (
    <div className="storage-item" ref={cardRef}>
      <div className="item-header" onClick={toggleExpanded}>
        <div className="item-title">
          {children.renderTitle()}
          <div className="item-status">
            {initialIsValidJson ? (
              <span className="status-valid">JSON</span>
            ) : (
              <span className="status-invalid" data-tooltip={initialError}>
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
            data-tooltip="Edit JSON"
          >
            ✏️
          </button>
          {children.renderActionButtons && children.renderActionButtons()}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="delete-btn"
            data-tooltip="Delete this item"
          >
            🗑️
          </button>
          <button 
            className={`expand-btn ${isExpanded ? 'expanded' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded();
            }}
            data-tooltip={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="item-content">
          {isEditing ? (
            <div className="edit-mode">
              <SimpleJsonEditor
                key={`editor-${itemKey}-${isEditing}`}
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
                {children.renderKeyDisplay()}
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

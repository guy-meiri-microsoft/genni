import { useState, useEffect } from 'react';
import type { LocalStorageItem } from '../types';
import { JsonEditor } from './JsonEditor';

interface LocalStorageItemComponentProps {
  item: LocalStorageItem;
  onUpdate: (key: string, newValue: string) => Promise<void>;
}

export const LocalStorageItemComponent: React.FC<LocalStorageItemComponentProps> = ({
  item,
  onUpdate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.value);
  const [editError, setEditError] = useState<string | undefined>();
  const [isValidJson, setIsValidJson] = useState(item.isValidJson);
  const [isSaving, setIsSaving] = useState(false);

  // Sync editValue when item.value changes (after successful save)
  useEffect(() => {
    setEditValue(item.value);
    setIsValidJson(item.isValidJson);
    setEditError(item.error);
  }, [item.value, item.isValidJson, item.error]);

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
          <div className="api-name">
            <span className="label">API:</span>
            <span className="value">{api}</span>
          </div>
          {startDate && endDate && (
            <div className="date-range">
              <span className="label">Period:</span>
              <span className="value">{startDate} → {endDate}</span>
            </div>
          )}
          {id && (
            <div className="mock-id">
              <span className="label">ID:</span>
              <span className="value" title={id}>{id.substring(0, 8)}...</span>
            </div>
          )}
          <div className="full-key">
            <span className="label">Full key:</span>
            <span className="value">{item.key}</span>
          </div>
        </div>
      );
    }
    
    // Fallback for non-mock keys or unparseable keys
    return (
      <div className="simple-key">
        <span className="value">{item.key}</span>
      </div>
    );
  };

  return (
    <div className="storage-item">
      <div className="item-header" onClick={toggleExpanded}>
        <div className="item-title">
          <h3 className="item-key">
            {item.mockParts ? item.mockParts.api : item.key}
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
          <div className="content-actions">
            {isEditing ? (
              <div className="edit-actions">
                <button 
                  onClick={handleSave} 
                  disabled={!isValidJson || isSaving}
                  className="save-btn"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={handleCancel} className="cancel-btn">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="view-actions">
                <button 
                  onClick={handleStartEdit}
                  className="edit-btn"
                >
                  Edit JSON
                </button>
              </div>
            )}
          </div>
          
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

import React, { useState } from 'react';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.value);
  const [editError, setEditError] = useState<string | undefined>();
  const [isValidJson, setIsValidJson] = useState(item.isValidJson);
  const [isSaving, setIsSaving] = useState(false);

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

  const displayValue = () => {
    if (item.isValidJson && item.parsedValue) {
      return JSON.stringify(item.parsedValue, null, 2);
    }
    return item.value;
  };

  return (
    <div className="storage-item">
      <div className="item-header">
        <h3 className="item-key">{item.key}</h3>
        <div className="item-actions">
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="edit-btn"
            >
              Edit
            </button>
          )}
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
      </div>

      {isEditing ? (
        <JsonEditor
          value={editValue}
          onChange={handleEditChange}
          onSave={handleSave}
          onCancel={handleCancel}
          isValid={isValidJson}
          error={editError}
        />
      ) : (
        <div className="item-content">
          <pre className="json-display">{displayValue()}</pre>
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

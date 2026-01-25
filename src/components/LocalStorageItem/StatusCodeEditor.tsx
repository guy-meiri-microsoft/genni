import { useState, useEffect } from 'react';
import type { LocalStorageItem } from '../../types';

interface StatusCodeEditorProps {
  item: LocalStorageItem;
  onUpdate: (key: string, newValue: string) => Promise<void>;
}

export function StatusCodeEditor({ item, onUpdate }: StatusCodeEditorProps): React.ReactNode {
  const [statusCode, setStatusCode] = useState<number>(item.statusCode || 200);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setStatusCode(item.statusCode || 200);
  }, [item.statusCode]);

  if (!item.hasStatusField) {
    return null;
  }

  async function handleSave(): Promise<void> {
    setIsSaving(true);
    try {
      const parsed = JSON.parse(item.value) as { data: unknown; status: number };
      parsed.status = statusCode;
      await onUpdate(item.key, JSON.stringify(parsed));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save status code:', error);
      alert('Failed to save status code');
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel(): void {
    setStatusCode(item.statusCode || 200);
    setIsEditing(false);
  }

  return (
    <div className="status-code-section">
      <div className="status-code-header">
        <label className="status-code-label">
          <span className="status-code-label-text">Status Code:</span>
          {!isEditing ? (
            <>
              <span className="status-code-value">{statusCode}</span>
              <button
                className="status-code-edit-btn"
                onClick={() => setIsEditing(true)}
                data-tooltip="Edit status code"
              >
                ✏️
              </button>
            </>
          ) : (
            <div className="status-code-edit-controls">
              <input
                type="number"
                value={statusCode}
                onChange={(e) => setStatusCode(parseInt(e.target.value) || 200)}
                min="100"
                max="599"
                className="status-code-input"
                disabled={isSaving}
                autoFocus
              />
              <button
                className="status-code-save-btn"
                onClick={handleSave}
                disabled={isSaving}
                data-tooltip="Save status code"
              >
                ✓
              </button>
              <button
                className="status-code-cancel-btn"
                onClick={handleCancel}
                disabled={isSaving}
                data-tooltip="Cancel"
              >
                ✕
              </button>
            </div>
          )}
        </label>
      </div>
    </div>
  );
}

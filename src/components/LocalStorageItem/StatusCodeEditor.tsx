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

  // Determine status code type for styling
  function getStatusType(code: number): string {
    if (code >= 200 && code < 300) return 'success';
    if (code >= 300 && code < 400) return 'redirect';
    if (code >= 400 && code < 500) return 'client-error';
    if (code >= 500) return 'server-error';
    return 'info';
  }

  async function handleSave(): Promise<void> {
    setIsSaving(true);
    try {
      const parsed = JSON.parse(item.value) as { data: unknown; statusCode: number };
      parsed.statusCode = statusCode;
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
    <span className="status-code-inline">
      {!isEditing ? (
        <>
          <span className="status-code-label">Status:</span>
          <span className={`status-code-value status-code-${getStatusType(statusCode)}`}>
            {statusCode}
          </span>
          <button
            className="status-code-edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            data-tooltip="Edit status code"
          >
            ✏️
          </button>
        </>
      ) : (
        <span className="status-code-editing">
          <span className="status-code-label">Edit Status:</span>
          <input
            type="number"
            value={statusCode}
            onChange={(e) => setStatusCode(parseInt(e.target.value) || 200)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            min="100"
            max="599"
            className="status-code-input"
            disabled={isSaving}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            placeholder="200"
          />
          <button
            className="status-code-save-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            disabled={isSaving}
            data-tooltip="Save (Enter)"
          >
            ✓
          </button>
          <button
            className="status-code-cancel-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleCancel();
            }}
            disabled={isSaving}
            data-tooltip="Cancel (Esc)"
          >
            ✕
          </button>
        </span>
      )}
    </span>
  );
}

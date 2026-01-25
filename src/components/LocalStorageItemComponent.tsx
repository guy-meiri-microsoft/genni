import type { LocalStorageItem } from '../types';
import { BaseItemComponent } from './BaseItemComponent';
import { highlightText } from '../utils/textUtils';
import { useState, useEffect } from 'react';

interface LocalStorageItemComponentProps {
  item: LocalStorageItem;
  onUpdate: (key: string, newValue: string) => Promise<void>;
  onDelete: (key: string) => Promise<void>;
  onSave?: (key: string, item: LocalStorageItem) => Promise<void>;
  searchTerm?: string;
}

function renderTitleBadge(mockParts: LocalStorageItem['mockParts']): React.ReactNode {
  if (!mockParts) return null;

  if (mockParts.startDate && mockParts.endDate) {
    return (
      <span className="date-preview">
        <small> ({mockParts.startDate} &#x2192; {mockParts.endDate})</small>
      </span>
    );
  }

  if (mockParts.isTimeless) {
    return (
      <span className="timeless-badge">
        <small> (no time range)</small>
      </span>
    );
  }

  return null;
}

export function LocalStorageItemComponent({
  item,
  onUpdate,
  onDelete,
  onSave,
  searchTerm = ''
}: LocalStorageItemComponentProps): React.ReactNode {
  // Status code from localStorage item (data/status format)
  const [itemStatusCode, setItemStatusCode] = useState<number>(item.statusCode || 200);
  const [isEditingStatusCode, setIsEditingStatusCode] = useState(false);
  const [isSavingStatusCode, setIsSavingStatusCode] = useState(false);

  // Update item status code when item changes
  useEffect(() => {
    setItemStatusCode(item.statusCode || 200);
  }, [item.statusCode]);

  async function handleSaveToFavorites(): Promise<void> {
    if (!onSave) return;

    try {
      await onSave(item.key, item);
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  }

  async function handleSaveStatusCode(): Promise<void> {
    if (!item.hasStatusField) {
      alert('This item does not have a status field');
      return;
    }

    setIsSavingStatusCode(true);
    try {
      // Parse the current value
      const parsed = JSON.parse(item.value) as { data: unknown; status: number };

      // Update the status
      parsed.status = itemStatusCode;

      // Save back to localStorage
      await onUpdate(item.key, JSON.stringify(parsed));
      setIsEditingStatusCode(false);
    } catch (error) {
      console.error('Failed to save status code:', error);
      alert('Failed to save status code');
    } finally {
      setIsSavingStatusCode(false);
    }
  }

  function handleCancelStatusCodeEdit(): void {
    setItemStatusCode(item.statusCode || 200);
    setIsEditingStatusCode(false);
  }

  function renderTitle(): React.ReactNode {
    const displayText = item.mockParts ? item.mockParts.api : item.key;
    return (
      <h3 className="item-key">
        {highlightText(displayText, searchTerm)}
        {renderTitleBadge(item.mockParts)}
      </h3>
    );
  }

  function renderKeyDisplay(): React.ReactNode {
    if (!item.mockParts) {
      return (
        <div className="simple-key">
          <span className="value">{highlightText(item.key, searchTerm)}</span>
        </div>
      );
    }

    const { api, startDate, endDate, id, isTimeless } = item.mockParts;

    return (
      <>
        <div className="mock-key-parts">
          <div className="key-info-inline">
            <span className="api-name">{highlightText(api, searchTerm)}</span>
            {!isTimeless && startDate && endDate && (
              <>
                <span className="separator">&#x2022;</span>
                <span className="date-range">{startDate} &#x2192; {endDate}</span>
              </>
            )}
            {isTimeless && (
              <>
                <span className="separator">&#x2022;</span>
                <span className="timeless-badge">Timeless</span>
              </>
            )}
            {id && (
              <>
                <span className="separator">&#x2022;</span>
                <span className="mock-id" data-tooltip={id}>{id.substring(0, 8)}...</span>
              </>
            )}
          </div>
        </div>
        {renderStatusCodeEditor()}
      </>
    );
  }

  function renderActionButtons(): React.ReactNode {
    if (!onSave) return null;

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleSaveToFavorites();
        }}
        className="save-btn"
        data-tooltip="Save to favorites"
      >
        &#x2B50;
      </button>
    );
  }

  function renderStatusCodeEditor(): React.ReactNode {
    if (!item.hasStatusField) {
      return null;
    }

    return (
      <div className="status-code-section">
        <div className="status-code-header">
          <label className="status-code-label">
            <span className="status-code-label-text">
              Status Code:
            </span>
            {!isEditingStatusCode ? (
              <>
                <span className="status-code-value">{itemStatusCode}</span>
                <button
                  className="status-code-edit-btn"
                  onClick={() => setIsEditingStatusCode(true)}
                  data-tooltip="Edit status code"
                >
                  ✏️
                </button>
              </>
            ) : (
              <div className="status-code-edit-controls">
                <input
                  type="number"
                  value={itemStatusCode}
                  onChange={(e) => setItemStatusCode(parseInt(e.target.value) || 200)}
                  min="100"
                  max="599"
                  className="status-code-input"
                  disabled={isSavingStatusCode}
                  autoFocus
                />
                <button
                  className="status-code-save-btn"
                  onClick={handleSaveStatusCode}
                  disabled={isSavingStatusCode}
                  data-tooltip="Save status code"
                >
                  ✓
                </button>
                <button
                  className="status-code-cancel-btn"
                  onClick={handleCancelStatusCodeEdit}
                  disabled={isSavingStatusCode}
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

  return (
    <BaseItemComponent
      itemKey={item.key}
      itemValue={item.value}
      isValidJson={item.isValidJson}
      error={item.error}
      onUpdate={onUpdate}
      onDelete={onDelete}
    >
      {{
        renderTitle,
        renderKeyDisplay,
        renderActionButtons
      }}
    </BaseItemComponent>
  );
}

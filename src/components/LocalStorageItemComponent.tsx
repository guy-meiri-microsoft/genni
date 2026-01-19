import type { LocalStorageItem } from '../types';
import { BaseItemComponent } from './BaseItemComponent';
import { highlightText } from '../utils/textUtils';

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
  async function handleSaveToFavorites(): Promise<void> {
    if (!onSave) return;

    try {
      await onSave(item.key, item);
    } catch (error) {
      console.error('Failed to save item:', error);
    }
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

import type { LocalStorageItem } from '../types';
import { BaseItemComponent } from './BaseItemComponent';
import { highlightText } from '../utils/textUtils';

interface LocalStorageItemComponentProps {
  item: LocalStorageItem;
  onUpdate: (key: string, newValue: string) => Promise<void>;
  onDelete: (key: string) => Promise<void>;
  onSave?: (key: string, item: LocalStorageItem) => Promise<void>;
  autoExpand?: boolean;
  searchTerm?: string;
  isFirstResult?: boolean;
}

export const LocalStorageItemComponent: React.FC<LocalStorageItemComponentProps> = ({
  item,
  onUpdate,
  onDelete,
  onSave,
  autoExpand = false,
  searchTerm = '',
  isFirstResult = false
}) => {
  const handleSaveToFavorites = async () => {
    if (!onSave) return;
    
    try {
      await onSave(item.key, item);
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  };

  const renderTitle = () => (
    <h3 className="item-key">
      {item.mockParts ? highlightText(item.mockParts.api, searchTerm) : highlightText(item.key, searchTerm)}
      {item.mockParts?.startDate && item.mockParts?.endDate && (
        <span className="date-preview">
          <small> ({item.mockParts.startDate} → {item.mockParts.endDate})</small>
        </span>
      )}
    </h3>
  );

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

  const renderActionButtons = () => (
    onSave && (
      <button 
        onClick={(e) => {
          e.stopPropagation();
          handleSaveToFavorites();
        }}
        className="save-btn"
        title="Save to favorites"
      >
        ⭐
      </button>
    )
  );

  return (
    <BaseItemComponent
      itemKey={item.key}
      itemValue={item.value}
      isValidJson={item.isValidJson}
      error={item.error}
      onUpdate={onUpdate}
      onDelete={onDelete}
      autoExpand={autoExpand}
      isFirstResult={isFirstResult}
    >
      {{
        renderTitle,
        renderKeyDisplay,
        renderActionButtons
      }}
    </BaseItemComponent>
  );
};

import type { LocalStorageItem } from '../../types';
import { BaseItemComponent } from '../BaseItemComponent';
import { highlightText } from '../../utils/textUtils';
import { MockKeyDisplay } from './MockKeyDisplay';
import { MockTitleBadge } from './MockTitleBadge';
import { StatusCodeEditor } from './StatusCodeEditor';

interface LocalStorageItemComponentProps {
  item: LocalStorageItem;
  onUpdate: (key: string, newValue: string) => Promise<void>;
  onDelete: (key: string) => Promise<void>;
  onSave?: (key: string, item: LocalStorageItem) => Promise<void>;
  searchTerm?: string;
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
        <MockTitleBadge mockParts={item.mockParts} />
      </h3>
    );
  }

  function renderKeyDisplay(): React.ReactNode {
    return (
      <>
        <MockKeyDisplay item={item} searchTerm={searchTerm} />
        <StatusCodeEditor item={item} onUpdate={onUpdate} />
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

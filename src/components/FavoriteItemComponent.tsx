import type { FavoriteItem } from '../types';
import { BaseItemComponent } from './BaseItemComponent';
import { highlightText } from '../utils/textUtils';
import { calculateDatesFromFilter, updateJsonDates, updateMockKey } from '../utils/dateUtils';
import { applyFavoriteToLocalStorage } from '../utils/chrome';

interface FavoriteItemComponentProps {
  item: FavoriteItem;
  onUpdate: (key: string, newValue: string) => Promise<void>;
  onDelete: (key: string) => Promise<void>;
  onApply?: (key: string) => Promise<void>;
  searchTerm?: string;
}

function truncateDisplayName(name: string, maxLength: number = 30): string {
  return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
}

export function FavoriteItemComponent({
  item,
  onUpdate,
  onDelete,
  onApply,
  searchTerm = ''
}: FavoriteItemComponentProps): React.ReactNode {
  async function handleApplyFavorite(): Promise<void> {
    try {
      let updatedJsonValue = item.value.value;
      let updatedKey = item.key;
      let alertMessage: string;

      if (item.isTimeless) {
        alertMessage = `Applied timeless favorite "${item.displayName}" to localStorage`;
      } else {
        const { startDate, endDate } = calculateDatesFromFilter(item.dateFilterOption);
        const originalStartDate = item.value.mockParts?.startDate;
        const originalEndDate = item.value.mockParts?.endDate;

        updatedJsonValue = updateJsonDates(
          item.value.value,
          startDate,
          endDate,
          originalStartDate,
          originalEndDate,
          false
        );
        updatedKey = updateMockKey(item.key, startDate, endDate);
        alertMessage = `Applied favorite "${item.displayName}" to localStorage with updated dates: ${startDate} \u2192 ${endDate}`;
      }

      await applyFavoriteToLocalStorage(item.key, updatedKey, updatedJsonValue);

      if (onApply) {
        await onApply(updatedKey);
      }

      alert(alertMessage);
    } catch (error) {
      console.error('Failed to apply favorite:', error);
      alert(`Failed to apply favorite: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  function renderTitle(): React.ReactNode {
    const displayText = truncateDisplayName(item.displayName);
    const badge = item.isTimeless
      ? <span className="timeless-badge"><small> Timeless</small></span>
      : <span className="date-preview"><small> {item.dateFilterOption}</small></span>;

    return (
      <h3 className="item-key">
        {highlightText(displayText, searchTerm)}
        {badge}
      </h3>
    );
  }

  function renderKeyDisplay(): React.ReactNode {
    const savedInfo = (
      <div className="saved-info">
        <small>Saved: {new Date(item.savedAt).toLocaleDateString()}</small>
      </div>
    );

    if (!item.value.mockParts) {
      return (
        <div className="simple-key">
          <span className="display-name">{highlightText(item.displayName, searchTerm)}</span>
          <span className="separator">&#x2022;</span>
          <span className="value">{highlightText(item.key, searchTerm)}</span>
          {savedInfo}
        </div>
      );
    }

    const { api, startDate, endDate, id, isTimeless } = item.value.mockParts;
    const isTimelessMock = item.isTimeless || isTimeless;
    const hasDateRange = !isTimelessMock && startDate && endDate;

    return (
      <div className="mock-key-parts">
        <div className="key-info-inline">
          <span className="display-name">{highlightText(item.displayName, searchTerm)}</span>
          <span className="separator">&#x2022;</span>
          <span className="api-name">{highlightText(api, searchTerm)}</span>
          {isTimelessMock && (
            <>
              <span className="separator">&#x2022;</span>
              <span className="timeless-badge">Timeless</span>
            </>
          )}
          {hasDateRange && (
            <>
              <span className="separator">&#x2022;</span>
              <span className="date-range">{item.dateFilterOption}</span>
            </>
          )}
          {id && (
            <>
              <span className="separator">&#x2022;</span>
              <span className="mock-id" data-tooltip={id}>{id.substring(0, 8)}...</span>
            </>
          )}
        </div>
        {savedInfo}
      </div>
    );
  }

  function renderActionButtons(): React.ReactNode {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleApplyFavorite();
        }}
        className="apply-btn"
        data-tooltip="Apply favorite to localStorage with current dates"
      >
        &#x1F4E5;
      </button>
    );
  }

  return (
    <BaseItemComponent
      itemKey={item.key}
      itemValue={item.value.value}
      isValidJson={item.value.isValidJson}
      error={item.value.error}
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

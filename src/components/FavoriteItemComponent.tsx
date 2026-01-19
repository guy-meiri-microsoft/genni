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
    autoExpand?: boolean;
    searchTerm?: string;
    isFirstResult?: boolean;
}

export const FavoriteItemComponent: React.FC<FavoriteItemComponentProps> = ({
    item,
    onUpdate,
    onDelete,
    onApply,
    autoExpand = false,
    searchTerm = '',
    isFirstResult = false
}) => {
    const handleApplyFavorite = async () => {
        try {
            let updatedJsonValue = item.value.value;
            let updatedKey = item.key;

            // Only update dates if NOT timeless
            if (!item.isTimeless) {
                // Calculate new dates based on the date filter option
                const { startDate, endDate } = calculateDatesFromFilter(item.dateFilterOption);

                // Get original dates from the favorite item's mock parts
                const originalStartDate = item.value.mockParts?.startDate;
                const originalEndDate = item.value.mockParts?.endDate;

                // Update the JSON value with new dates, preserving timestamp positions
                updatedJsonValue = updateJsonDates(
                    item.value.value,
                    startDate,
                    endDate,
                    originalStartDate,
                    originalEndDate,
                    false // isTimeless
                );

                // Update the key with new dates
                updatedKey = updateMockKey(item.key, startDate, endDate);

                // Apply to localStorage
                await applyFavoriteToLocalStorage(item.key, updatedKey, updatedJsonValue);

                // Call the optional callback
                if (onApply) {
                    await onApply(updatedKey);
                }

                alert(`Applied favorite "${item.displayName}" to localStorage with updated dates: ${startDate} → ${endDate}`);
            } else {
                // For timeless mocks, apply as-is without date updates
                await applyFavoriteToLocalStorage(item.key, updatedKey, updatedJsonValue);

                // Call the optional callback
                if (onApply) {
                    await onApply(updatedKey);
                }

                alert(`Applied timeless favorite "${item.displayName}" to localStorage`);
            }
        } catch (error) {
            console.error('Failed to apply favorite:', error);
            alert(`Failed to apply favorite: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };
    const renderTitle = () => (
        <h3 className="item-key">
            {highlightText(
            item.displayName.length > 30
                ? item.displayName.substring(0, 30) + '...'
                : item.displayName,
            searchTerm
            )}
            {item.isTimeless ? (
                <span className="timeless-badge">
                    <small> Timeless</small>
                </span>
            ) : (
                <span className="date-preview">
                    <small> {item.dateFilterOption}</small>
                </span>
            )}
        </h3>
    );

    const renderKeyDisplay = () => {
        if (item.value.mockParts) {
            const { api, startDate, endDate, id, isTimeless } = item.value.mockParts;
            return (
                <div className="mock-key-parts">
                    <div className="key-info-inline">
                        <span className="display-name">{highlightText(item.displayName, searchTerm)}</span>
                        <span className="separator">•</span>
                        <span className="api-name">{highlightText(api, searchTerm)}</span>
                        {item.isTimeless || isTimeless ? (
                            <>
                                <span className="separator">•</span>
                                <span className="timeless-badge">Timeless</span>
                            </>
                        ) : startDate && endDate ? (
                            <>
                                <span className="separator">•</span>
                                <span className="date-range">{item.dateFilterOption}</span>
                            </>
                        ) : null}
                        {id && (
                            <>
                                <span className="separator">•</span>
                                <span className="mock-id" data-tooltip={id}>{id.substring(0, 8)}...</span>
                            </>
                        )}
                    </div>
                    <div className="saved-info">
                        <small>Saved: {new Date(item.savedAt).toLocaleDateString()}</small>
                    </div>
                </div>
            );
        }

        // Fallback for non-mock keys or unparseable keys
        return (
            <div className="simple-key">
                <span className="display-name">{highlightText(item.displayName, searchTerm)}</span>
                <span className="separator">•</span>
                <span className="value">{highlightText(item.key, searchTerm)}</span>
                <div className="saved-info">
                    <small>Saved: {new Date(item.savedAt).toLocaleDateString()}</small>
                </div>
            </div>
        );
    };

    const renderActionButtons = () => (
        <button 
            onClick={(e) => {
                e.stopPropagation();
                handleApplyFavorite();
            }}
            className="apply-btn"
            data-tooltip="Apply favorite to localStorage with current dates"
        >
            📥
        </button>
    );

    return (
        <BaseItemComponent
            itemKey={item.key}
            itemValue={item.value.value}
            isValidJson={item.value.isValidJson}
            error={item.value.error}
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

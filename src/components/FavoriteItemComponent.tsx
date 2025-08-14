import type { FavoriteItem } from '../types';
import { BaseItemComponent } from './BaseItemComponent';
import { highlightText } from '../utils/textUtils';

interface FavoriteItemComponentProps {
    item: FavoriteItem;
    onUpdate: (key: string, newValue: string) => Promise<void>;
    onDelete: (key: string) => Promise<void>;
    autoExpand?: boolean;
    searchTerm?: string;
    isFirstResult?: boolean;
}

export const FavoriteItemComponent: React.FC<FavoriteItemComponentProps> = ({
    item,
    onUpdate,
    onDelete,
    autoExpand = false,
    searchTerm = '',
    isFirstResult = false
}) => {
    const renderTitle = () => (
        <h3 className="item-key">
            {highlightText(
            item.displayName.length > 30
                ? item.displayName.substring(0, 30) + '...'
                : item.displayName,
            searchTerm
            )}
            <span className="date-preview">
            <small>{item.dateFilterOption}</small>
            </span>
        </h3>
    );

    const renderKeyDisplay = () => {
        if (item.value.mockParts) {
            const { api, startDate, endDate, id } = item.value.mockParts;
            return (
                <div className="mock-key-parts">
                    <div className="key-info-inline">
                        <span className="display-name">{highlightText(item.displayName, searchTerm)}</span>
                        <span className="separator">•</span>
                        <span className="api-name">{highlightText(api, searchTerm)}</span>
                        {startDate && endDate && (
                            <>
                                <span className="separator">•</span>
                                <span className="date-range">{item.dateFilterOption}</span>
                            </>
                        )}
                        {id && (
                            <>
                                <span className="separator">•</span>
                                <span className="mock-id" title={id}>{id.substring(0, 8)}...</span>
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
                renderKeyDisplay
            }}
        </BaseItemComponent>
    );
};

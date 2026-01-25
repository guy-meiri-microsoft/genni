import type { LocalStorageItem } from '../../types';
import { highlightText } from '../../utils/textUtils';

interface MockKeyDisplayProps {
  item: LocalStorageItem;
  searchTerm: string;
}

export function MockKeyDisplay({ item, searchTerm }: MockKeyDisplayProps): React.ReactNode {
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

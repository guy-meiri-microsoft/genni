import type { LocalStorageItem } from '../types';
import { LocalStorageItemComponent } from './LocalStorageItemComponent';

interface ActiveMocksTabProps {
  items: LocalStorageItem[];
  currentTab: string;
  searchTerm: string;
  loading: boolean;
  error?: string;
  onUpdateItem: (key: string, newValue: string) => Promise<void>;
  onDeleteItem: (key: string) => Promise<void>;
  onSaveItem: (key: string, item: LocalStorageItem) => Promise<void>;
  onReload: () => Promise<void>;
}

interface MocksSectionProps {
  title: string;
  items: LocalStorageItem[];
  searchTerm: string;
  onUpdateItem: (key: string, newValue: string) => Promise<void>;
  onDeleteItem: (key: string) => Promise<void>;
  onSaveItem: (key: string, item: LocalStorageItem) => Promise<void>;
}

function MocksSection({ title, items, searchTerm, onUpdateItem, onDeleteItem, onSaveItem }: MocksSectionProps): React.ReactNode {
  if (items.length === 0) return null;

  return (
    <div className="mocks-section">
      <h3 className="section-header">{title}</h3>
      <div className="items-count">{items.length} item{items.length !== 1 ? 's' : ''}</div>
      <div className="items-list">
        {items.map((item) => (
          <LocalStorageItemComponent
            key={item.key}
            item={item}
            onUpdate={onUpdateItem}
            onDelete={onDeleteItem}
            onSave={onSaveItem}
            searchTerm={searchTerm}
          />
        ))}
      </div>
    </div>
  );
}

export function ActiveMocksTab({
  items,
  currentTab,
  searchTerm,
  loading,
  error,
  onUpdateItem,
  onDeleteItem,
  onSaveItem,
  onReload
}: ActiveMocksTabProps): React.ReactNode {
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading localStorage items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={onReload} className="retry-btn" data-tooltip="Retry loading active mocks">
          Try Again
        </button>
      </div>
    );
  }

  const analyticsMocks = items.filter(item => !item.mockParts?.isTimeless);
  const evaluationsMocks = items.filter(item => item.mockParts?.isTimeless);

  return (
    <div className="tab-content">
      {items.length === 0 ? (
        <div className="no-items">
          <p>No localStorage mock items found{searchTerm && ` matching "${searchTerm}"`}</p>
          <p>Make sure you're on a page that has localStorage items with the "mock_" prefix.</p>
        </div>
      ) : (
        <div>
          <MocksSection
            title="Analytics"
            items={analyticsMocks}
            searchTerm={searchTerm}
            onUpdateItem={onUpdateItem}
            onDeleteItem={onDeleteItem}
            onSaveItem={onSaveItem}
          />
          <MocksSection
            title="Evaluations"
            items={evaluationsMocks}
            searchTerm={searchTerm}
            onUpdateItem={onUpdateItem}
            onDeleteItem={onDeleteItem}
            onSaveItem={onSaveItem}
          />
        </div>
      )}
      <div className="current-tab">
        <small>Current tab: {currentTab}</small>
      </div>
    </div>
  );
}

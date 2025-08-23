import { useRef } from 'react';
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
}: ActiveMocksTabProps) {
  const itemsListRef = useRef<HTMLDivElement>(null);

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
        <button onClick={onReload} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="tab-content">
      {items.length === 0 ? (
        <div className="no-items">
          <p>No localStorage mock items found{searchTerm && ` matching "${searchTerm}"`}</p>
          <p>Make sure you're on a page that has localStorage items with the "mock_" prefix.</p>
        </div>
      ) : (
        <div className="items-list" ref={itemsListRef}>
          {items.map((item) => (
            <LocalStorageItemComponent
              key={item.key}
              item={item}
              onUpdate={onUpdateItem}
              onDelete={onDeleteItem}
              onSave={onSaveItem}
              autoExpand={false}
              searchTerm={searchTerm}
              isFirstResult={false}
            />
          ))}
        </div>
      )}
      <div className="current-tab">
        <small>Current tab: {currentTab}</small>
      </div>
    </div>
  );
}

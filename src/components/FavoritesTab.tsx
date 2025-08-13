import { useRef } from 'react';
import type { FavoriteItem } from '../types';
import { LocalStorageItemComponent } from './LocalStorageItemComponent';

interface FavoritesTabProps {
  items: FavoriteItem[];
  searchTerm: string;
  loading: boolean;
  error?: string;
  onUpdateItem: (key: string, newValue: string) => Promise<void>;
  onDeleteItem: (key: string) => Promise<void>;
  onReload: () => Promise<void>;
}

export function FavoritesTab({
  items,
  searchTerm,
  loading,
  error,
  onUpdateItem,
  onDeleteItem,
  onReload
}: FavoritesTabProps) {
  const itemsListRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading favorites...</p>
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
          <p>No favorites found{searchTerm && ` matching "${searchTerm}"`}</p>
          <p>Save some mock items to favorites by clicking the ⭐ button on any item in the Active Mocks tab.</p>
        </div>
      ) : (
        <div className="items-list" ref={itemsListRef}>
          {items.map((item) => (
            <LocalStorageItemComponent
              key={item.displayName}
              item={item.value}
              onUpdate={onUpdateItem}
              onDelete={onDeleteItem}
              autoExpand={false}
              searchTerm=""
              isFirstResult={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

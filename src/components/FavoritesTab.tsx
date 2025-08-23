import { useRef } from 'react';
import type { FavoriteItem } from '../types';
import { FavoriteItemComponent } from './FavoriteItemComponent';

interface FavoritesTabProps {
  items: FavoriteItem[];
  searchTerm: string;
  loading: boolean;
  error?: string;
  onUpdateItem: (key: string, newValue: string) => Promise<void>;
  onDeleteItem: (key: string) => Promise<void>;
  onApplyItem?: (key: string) => Promise<void>;
  onReload: () => Promise<void>;
  onExportFavorites: () => Promise<void>;
  onImportFavorites: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function FavoritesTab({
  items,
  searchTerm,
  loading,
  error,
  onUpdateItem,
  onDeleteItem,
  onApplyItem,
  onReload,
  onExportFavorites,
  onImportFavorites
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
        <button onClick={onReload} className="retry-btn" data-tooltip="Retry loading favorites">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="tab-content">
      {items.length === 0 ? (
        <div className="no-items">
          <div className="no-items-content">
            <div className="no-items-icon">⭐</div>
            <h3>No favorites yet</h3>
            <p>Save some mock items to favorites by clicking the ⭐ button on any item in the Active Mocks tab.</p>
            {searchTerm && (
              <p className="search-info">No favorites found matching "{searchTerm}"</p>
            )}
            <div className="import-export-section">
              <div className="section-header">
                <h4>Manage Favorites</h4>
                <p>Import favorites from a previous export</p>
              </div>
              <div className="import-export-actions">
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportFavorites}
                  style={{ display: 'none' }}
                  id="import-favorites-empty"
                />
                <label htmlFor="import-favorites-empty" className="elegant-btn import-btn">
                  <span className="btn-icon">⤴️</span>
                  <span className="btn-text">Import Favorites</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="favorites-header">
            <div className="favorites-meta">
              <h3>Your Favorites ({items.length})</h3>
              <p>Manage and organize your saved mock configurations</p>
            </div>
            <div className="import-export-section">
              <div className="import-export-actions">
                <button onClick={onExportFavorites} className="elegant-btn export-btn">
                  <span className="btn-icon">💾</span>
                  <span className="btn-text">Export</span>
                </button>
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportFavorites}
                  style={{ display: 'none' }}
                  id="import-favorites-list"
                />
                <label htmlFor="import-favorites-list" className="elegant-btn import-btn">
                  <span className="btn-icon">⤴️</span>
                  <span className="btn-text">Import</span>
                </label>
              </div>
            </div>
          </div>
          <div className="items-list" ref={itemsListRef}>
            {items.map((item) => (
              <FavoriteItemComponent
                key={item.displayName}
                item={item}
                onUpdate={onUpdateItem}
                onDelete={onDeleteItem}
                onApply={onApplyItem}
                autoExpand={false}
                searchTerm={searchTerm}
                isFirstResult={false}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

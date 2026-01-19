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

interface FavoritesSectionProps {
  title: string;
  items: FavoriteItem[];
  searchTerm: string;
  onUpdateItem: (key: string, newValue: string) => Promise<void>;
  onDeleteItem: (key: string) => Promise<void>;
  onApplyItem?: (key: string) => Promise<void>;
}

function FavoritesSection({ title, items, searchTerm, onUpdateItem, onDeleteItem, onApplyItem }: FavoritesSectionProps): React.ReactNode {
  if (items.length === 0) return null;

  return (
    <div className="mocks-section">
      <h3 className="section-header">{title}</h3>
      <div className="items-count">{items.length} item{items.length !== 1 ? 's' : ''}</div>
      <div className="items-list">
        {items.map((item) => (
          <FavoriteItemComponent
            key={item.displayName}
            item={item}
            onUpdate={onUpdateItem}
            onDelete={onDeleteItem}
            onApply={onApplyItem}
            searchTerm={searchTerm}
          />
        ))}
      </div>
    </div>
  );
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
}: FavoritesTabProps): React.ReactNode {
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

  if (items.length === 0) {
    return (
      <div className="tab-content">
        <div className="no-items">
          <div className="no-items-content">
            <div className="no-items-icon">&#x2B50;</div>
            <h3>No favorites yet</h3>
            <p>Save some mock items to favorites by clicking the &#x2B50; button on any item in the Active Mocks tab.</p>
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
                  <span className="btn-icon">&#x2934;&#xFE0F;</span>
                  <span className="btn-text">Import Favorites</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const analyticsFavorites = items.filter(fav => !fav.isTimeless);
  const evaluationsFavorites = items.filter(fav => fav.isTimeless);

  return (
    <div className="tab-content">
      <div className="favorites-header">
        <div className="favorites-meta">
          <h3>Your Favorites ({items.length})</h3>
          <p>Manage and organize your saved mock configurations</p>
        </div>
        <div className="import-export-section">
          <div className="import-export-actions">
            <button onClick={onExportFavorites} className="elegant-btn export-btn">
              <span className="btn-icon">&#x1F4BE;</span>
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
              <span className="btn-icon">&#x2934;&#xFE0F;</span>
              <span className="btn-text">Import</span>
            </label>
          </div>
        </div>
      </div>
      <div>
        <FavoritesSection
          title="Analytics"
          items={analyticsFavorites}
          searchTerm={searchTerm}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onApplyItem={onApplyItem}
        />
        <FavoritesSection
          title="Evaluations"
          items={evaluationsFavorites}
          searchTerm={searchTerm}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onApplyItem={onApplyItem}
        />
      </div>
    </div>
  );
}

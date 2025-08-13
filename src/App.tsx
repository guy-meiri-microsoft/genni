import { useState, useEffect, useCallback } from 'react';
import type { LocalStorageItem, FavoriteItem, ActiveExtensionTab } from './types';
import { VersionChecker } from './components/VersionChecker';
import { MockToggle } from './components/MockToggle';
import { ActiveMocksTab } from './components/ActiveMocksTab';
import { FavoritesTab } from './components/FavoritesTab';
import { getLocalStorageItems, updateLocalStorageItem, deleteLocalStorageItem, getCurrentTab, refreshCurrentTab, clearAllMocks, saveItemToFavorites, getFavoriteItems, updateFavoriteItem, deleteFavoriteItem } from './utils/chrome';
import { extractIdsFromUrl } from './utils/mockToggle';
import './App.css';

function App() {
  const [items, setItems] = useState<LocalStorageItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [activeExtensionTab, setActiveExtensionTab] = useState<ActiveExtensionTab>({
    type: 'active-mocks',
    items: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentWebTab, setCurrentWebTab] = useState<string>('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const tab = await getCurrentTab();
      if (tab) {
        setCurrentWebTab(tab.url);
        const loadedItems = await getLocalStorageItems(searchTerm);
        setItems(loadedItems);
      } else {
        setError('No active tab found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load localStorage items');
      console.error('Error loading items:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const loadFavorites = useCallback(async () => {
    try {
      const favoriteItems = await getFavoriteItems();
      setFavorites(favoriteItems);
    } catch (err) {
      console.error('Error loading favorites:', err);
      // Don't set error state for favorites, just log it
    }
  }, []);

  const handleUpdateItem = async (key: string, newValue: string) => {
    try {
      await updateLocalStorageItem(key, newValue);
      // Reload items to reflect the change
      await loadItems();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update item');
    }
  };

  const handleDeleteItem = async (key: string) => {
    try {
      await deleteLocalStorageItem(key);
      // Reload items to reflect the change
      await loadItems();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const handleSaveItem = async (key: string, item: LocalStorageItem) => {
    const displayName = prompt(`Enter a name for this saved item:`, key);
    if (!displayName) {
      return; // User cancelled
    }

    try {
      await saveItemToFavorites(key, item, displayName);
      alert('Item saved to favorites successfully!');
      // Reload favorites to show the new item
      await loadFavorites();
    } catch (err) {
      alert(`Failed to save item: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdateFavoriteItem = async (key: string, newValue: string) => {
    try {
      await updateFavoriteItem(key, newValue);
      // Reload favorites to reflect the change
      await loadFavorites();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update favorite item');
    }
  };

  const handleDeleteFavoriteItem = async (key: string) => {
    try {
      await deleteFavoriteItem(key);
      // Reload favorites to reflect the change
      await loadFavorites();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete favorite item');
    }
  };

  // Filter items based on current environment/bot context
  const getFilteredItems = useCallback(() => {
    if (!currentWebTab) return items;
    
    const { envId, botId } = extractIdsFromUrl(currentWebTab);
    
    // If no environment context, show all items
    if (!envId) return items;
    
    return items.filter(item => {
      // If item has no mockParts or no id, include it
      if (!item.mockParts?.id) return true;
      
      // Check if the item's id matches current environment or bot
      return item.mockParts.id === envId || item.mockParts.id === botId;
    });
  }, [items, currentWebTab]);

  // Filter favorites based on search term
  const getFilteredFavorites = useCallback(() => {
    if (!searchTerm) return favorites;
    
    return favorites
      .filter(fav => {
        const displayName = fav.displayName.toLowerCase();
        const key = fav.key.toLowerCase();
        const apiName = fav.value.mockParts?.api?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();
        
        return displayName.includes(searchLower) || 
               key.includes(searchLower) || 
               apiName.includes(searchLower);
      });
  }, [favorites, searchTerm]);

  // Update items in view whenever data changes
  useEffect(() => {
    if (activeExtensionTab.type === 'active-mocks') {
      const filteredItems = getFilteredItems();
      setActiveExtensionTab(prev => 
        prev.type === 'active-mocks' 
          ? { type: 'active-mocks', items: filteredItems }
          : prev
      );
    }
  }, [items, currentWebTab, getFilteredItems, activeExtensionTab.type]);

  useEffect(() => {
    if (activeExtensionTab.type === 'favorites') {
      const filteredFavorites = getFilteredFavorites();
      setActiveExtensionTab(prev => 
        prev.type === 'favorites' 
          ? { type: 'favorites', items: filteredFavorites }
          : prev
      );
    }
  }, [favorites, searchTerm, getFilteredFavorites, activeExtensionTab.type]);

  // Load items on mount
  useEffect(() => {
    loadItems();
    loadFavorites();
  }, [loadItems, loadFavorites]);

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    // Don't auto-reload, let user press enter or click search
  };

  const handleSearchSubmit = async () => {
    await loadItems();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  const handleRefreshPage = async () => {
    try {
      await refreshCurrentTab();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh page');
    }
  };

  const handleClearAllMocks = async () => {
    if (!confirm('Are you sure you want to clear all mock data? This cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const deletedCount = await clearAllMocks();
      
      // Reload items to reflect the changes
      await loadItems();
      
      // Show success message temporarily
      alert(`Successfully cleared ${deletedCount} mock item${deletedCount !== 1 ? 's' : ''}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear mocks');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading localStorage items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadItems} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <VersionChecker />
      <header className="app-header">
        <div>🔥 Genni 🔥</div>
        <div className="top-actions">
          <div className="header-search">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search API..."
              className="header-search-input"
            />
            <button onClick={handleSearchSubmit} className="header-search-btn">
              🔍
            </button>
          </div>
          <MockToggle 
            currentTabUrl={currentWebTab}
            onToggle={(isEnabled) => {
              console.log('Mock toggle changed:', isEnabled);
            }}
          />
          <button 
            onClick={handleRefreshPage} 
            className="action-btn refresh-page-btn"
            title="Refresh Page"
          >
            🔄
          </button>
          <button 
            onClick={handleClearAllMocks} 
            className="action-btn clear-mocks-btn"
            title="Clear All Mocks"
          >
            🗑️
          </button>
        </div>
      </header>

      <div className="tabs-container">
        <div className="tabs-header">
          <button
            className={`tab-button ${activeExtensionTab.type === 'active-mocks' ? 'active' : ''}`}
            onClick={() => setActiveExtensionTab({
              type: 'active-mocks',
              items: getFilteredItems()
            })}
          >
            Active Mocks
          </button>
          <button
            className={`tab-button ${activeExtensionTab.type === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveExtensionTab({
              type: 'favorites',
              items: getFilteredFavorites()
            })}
          >
            Favorites
          </button>
        </div>

        <main className="main-content">
          {activeExtensionTab.type === 'active-mocks' ? (
            <ActiveMocksTab
              items={activeExtensionTab.items}
              currentTab={currentWebTab}
              searchTerm={searchTerm}
              loading={loading}
              error={error}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onSaveItem={handleSaveItem}
              onReload={loadItems}
            />
          ) : (
            <FavoritesTab 
              items={activeExtensionTab.items}
              searchTerm={searchTerm}
              loading={loading}
              error={error}
              onUpdateItem={handleUpdateFavoriteItem}
              onDeleteItem={handleDeleteFavoriteItem}
              onReload={loadFavorites}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

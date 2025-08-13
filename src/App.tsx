import { useState, useEffect, useCallback } from 'react';
import type { LocalStorageItem } from './types';
import { VersionChecker } from './components/VersionChecker';
import { MockToggle } from './components/MockToggle';
import { ActiveMocksTab } from './components/ActiveMocksTab';
import { FavoritesTab } from './components/FavoritesTab';
import { getLocalStorageItems, updateLocalStorageItem, deleteLocalStorageItem, getCurrentTab, refreshCurrentTab, clearAllMocks } from './utils/chrome';
import { extractIdsFromUrl } from './utils/mockToggle';
import './App.css';

function App() {
  const [items, setItems] = useState<LocalStorageItem[]>([]);
  const [itemsInView, setItemsInView] = useState<LocalStorageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentWebTab, setCurrentWebTab] = useState<string>('');
  const [activeExtensionTab, setActiveExtensionTab] = useState<'active-mocks' | 'favorites'>('active-mocks');

  const loadItems = async () => {
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
  };

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

  // Update items in view based on active tab and filtering
  const updateItemsInView = useCallback(() => {
    if (activeExtensionTab === 'active-mocks') {
      const filteredItems = getFilteredItems();
      setItemsInView(filteredItems);
    } else if (activeExtensionTab === 'favorites') {
      // For now, favorites are empty, but this could be extended later
      setItemsInView([]);
    }
  }, [getFilteredItems, activeExtensionTab]);

  // Update items in view whenever dependencies change
  useEffect(() => {
    updateItemsInView();
  }, [updateItemsInView]);

  // Load items on mount
  useEffect(() => {
    loadItems();
  }, []);

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
            className={`tab-button ${activeExtensionTab === 'active-mocks' ? 'active' : ''}`}
            onClick={() => setActiveExtensionTab('active-mocks')}
          >
            Active Mocks
          </button>
          <button
            className={`tab-button ${activeExtensionTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveExtensionTab('favorites')}
          >
            Favorites
          </button>
        </div>

        <main className="main-content">
          {activeExtensionTab === 'active-mocks' ? (
            <ActiveMocksTab
              items={itemsInView}
              currentTab={currentWebTab}
              searchTerm={searchTerm}
              loading={loading}
              error={error}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onReload={loadItems}
            />
          ) : (
            <FavoritesTab />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

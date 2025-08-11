import { useState, useEffect } from 'react';
import type { LocalStorageItem } from './types';
import { LocalStorageItemComponent } from './components/LocalStorageItemComponent';
import { getLocalStorageItems, updateLocalStorageItem, getCurrentTab, refreshCurrentTab, clearAllMocks } from './utils/chrome';
import './App.css';

function App() {
  const [items, setItems] = useState<LocalStorageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState<string>('');

  const loadItems = async () => {
    setLoading(true);
    setError(undefined);

    try {
      const tab = await getCurrentTab();
      if (tab) {
        setCurrentTab(tab.url);
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

  // Load items on mount
  useEffect(() => {
    loadItems();
  }, []);

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    // Don't auto-reload, let user click refresh
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
      <header className="app-header">
        <div > 🔥 Genni 🔥 </div>
        <div className="top-actions">
          <button onClick={handleRefreshPage} className="action-btn refresh-page-btn">
            🔄 Refresh Page
          </button>
          <button onClick={handleClearAllMocks} className="action-btn clear-mocks-btn">
            🗑️ Clear All Mocks
          </button>
        </div>
      </header>

      <div className="controls">
        <div className="prefix-control">
          <label htmlFor="search">Search API:</label>
          <input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="e.g., billing, summary, order..."
          />
        </div>
        <button onClick={loadItems} className="refresh-btn">
          Search
        </button>
      </div>

      <main className="main-content">
        {items.length === 0 ? (
          <div className="no-items">
            <p>No localStorage mock items found{searchTerm && ` matching "${searchTerm}"`}</p>
            <p>Make sure you're on a page that has localStorage items with the "mock_" prefix.</p>
          </div>
        ) : (
          <div className="items-list">
            {items.map((item) => (
              <LocalStorageItemComponent
                key={item.key}
                item={item}
                onUpdate={handleUpdateItem}
              />
            ))}
          </div>
        )}
        <div className="current-tab">
          <small>Current tab: {currentTab}</small>
        </div>
      </main>
    </div>
  );
}

export default App;

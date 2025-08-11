import { useState, useEffect, useCallback } from 'react';
import type { LocalStorageItem } from './types';
import { LocalStorageItemComponent } from './components/LocalStorageItemComponent';
import { getLocalStorageItems, updateLocalStorageItem, getCurrentTab } from './utils/chrome';
import './App.css';

function App() {
  const [items, setItems] = useState<LocalStorageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [prefix, setPrefix] = useState('mock_');
  const [currentTab, setCurrentTab] = useState<string>('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    
    try {
      const tab = await getCurrentTab();
      if (tab) {
        setCurrentTab(tab.url);
        const loadedItems = await getLocalStorageItems(prefix);
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
  }, [prefix]);

  const handleUpdateItem = async (key: string, newValue: string) => {
    try {
      await updateLocalStorageItem(key, newValue);
      // Reload items to reflect the change
      await loadItems();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update item');
    }
  };

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handlePrefixChange = (newPrefix: string) => {
    setPrefix(newPrefix);
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
        <h1>LocalStorage JSON Manager</h1>
        <div className="current-tab">
          <small>Current tab: {currentTab}</small>
        </div>
      </header>

      <div className="controls">
        <div className="prefix-control">
          <label htmlFor="prefix">Key prefix:</label>
          <input
            id="prefix"
            type="text"
            value={prefix}
            onChange={(e) => handlePrefixChange(e.target.value)}
            placeholder="e.g., mock_"
          />
        </div>
        <button onClick={loadItems} className="refresh-btn">
          Refresh
        </button>
      </div>

      <main className="main-content">
        {items.length === 0 ? (
          <div className="no-items">
            <p>No localStorage items found with prefix "{prefix}"</p>
            <p>Make sure you're on a page that has localStorage items with this prefix.</p>
          </div>
        ) : (
          <div className="items-list">
            <div className="items-count">
              Found {items.length} item{items.length !== 1 ? 's' : ''}
            </div>
            {items.map((item) => (
              <LocalStorageItemComponent
                key={item.key}
                item={item}
                onUpdate={handleUpdateItem}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

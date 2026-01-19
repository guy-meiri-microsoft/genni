import type { LocalStorageItem, ChromeTabInfo, MockKeyParts, FavoriteItem, DateFilterOptions } from '../types';
import { extractIdsFromUrl } from './mockToggle';

/**
 * Calculates the appropriate DateFilterOptions based on start and end dates
 */
function calculateDateFilterOption(startDate?: string, endDate?: string): DateFilterOptions {
  if (!startDate || !endDate) {
    return 'None';
  }

  try {
    const currentYear = new Date().getFullYear();
    const [startDay, startMonth] = startDate.split('/');
    const [endDay, endMonth] = endDate.split('/');

    const start = new Date(`${currentYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}`);
    let end = new Date(`${currentYear}-${endMonth.padStart(2, '0')}-${endDay.padStart(2, '0')}`);

    // Handle year overflow: if end date is before start date, end date is in the next year
    if (end < start) {
      end = new Date(`${currentYear + 1}-${endMonth.padStart(2, '0')}-${endDay.padStart(2, '0')}`);
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) return 'Last7Days';
    if (diffDays <= 14) return 'Last14Days';
    return 'Last30Days';
  } catch (error) {
    console.warn('Failed to parse dates for filter calculation:', { startDate, endDate, error });
    return 'Last30Days';
  }
}

/**
 * Parses a mock key into its component parts
 * Expected format: mock_<api>_<start>_<end>_<id> or mock_<api> (timeless)
 * Example: mock_billingSummary_05/08_12/08_4f91ba29-52bc-ef11-8ee7-000d3a5a9be8
 */
export function parseMockKey(key: string, currentTabUrl?: string): MockKeyParts | null {
  const parts = key.split('_');

  if (parts.length < 2 || parts[0] !== 'mock') {
    return null;
  }

  const datePattern = /^\d{2}\/\d{2}$/;
  const hasDateRange = parts.length >= 3 && datePattern.test(parts[2]);

  const result: MockKeyParts = {
    prefix: parts[0],
    api: parts[1],
    rawKey: key,
    isTimeless: !hasDateRange
  };

  if (hasDateRange) {
    result.startDate = parts[2];
    if (parts.length >= 4) result.endDate = parts[3];
    if (parts.length >= 5) result.id = parts[4];
  }

  // If no ID was found in the key but we have URL context, use environment/bot ID
  if (!result.id && currentTabUrl) {
    const { envId, botId } = extractIdsFromUrl(currentTabUrl);
    result.id = botId || envId || undefined;
  }

  return result;
}

/**
 * Gets the current active tab information
 */
export async function getCurrentTab(): Promise<ChromeTabInfo | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id || !tab.url) return null;

    return {
      id: tab.id,
      url: tab.url,
      title: tab.title || 'Unknown'
    };
  } catch (error) {
    console.error('Error getting current tab:', error);
    return null;
  }
}

/**
 * Executes a script in the current tab to access localStorage
 */
export async function executeInTab<T>(
  tabId: number,
  func: (...args: unknown[]) => T,
  ...args: unknown[]
): Promise<T> {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func,
    args
  });

  if (result?.result === undefined) {
    throw new Error('Script execution failed or returned undefined');
  }

  return result.result as T;
}

/**
 * Gets all localStorage items matching a search term (searches within API names)
 */
export async function getLocalStorageItems(searchTerm: string = ''): Promise<LocalStorageItem[]> {
  console.log('🌐 Chrome: Getting localStorage items with searchTerm:', searchTerm);

  const tab = await getCurrentTab();
  if (!tab) {
    throw new Error('No active tab found');
  }

  console.log('🌐 Chrome: Current tab:', tab);

  const items = await executeInTab(tab.id, () => {
    const items: { key: string; value: string }[] = [];

    console.log('🌐 Chrome: Executing in tab, localStorage.length:', localStorage.length);

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mock_')) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          console.log('🌐 Chrome: Found mock item - key:', key, 'value length:', value.length);
          items.push({ key, value });
        }
      }
    }

    console.log('🌐 Chrome: Total mock items found:', items.length);
    return items;
  });

  console.log('🌐 Chrome: Items received from tab:', items.length);

  return items
    .map(item => {
      console.log('🌐 Chrome: Processing item:', item.key, 'value length:', item.value.length);

      let parsedValue: unknown;
      let isValidJson = false;
      let error: string | undefined;

      try {
        parsedValue = JSON.parse(item.value);
        isValidJson = true;
        console.log('🌐 Chrome: Successfully parsed JSON for:', item.key);
      } catch (e) {
        error = e instanceof Error ? e.message : 'Invalid JSON';
        isValidJson = false;
        console.log('🌐 Chrome: JSON parse error for:', item.key, error);
      }

      // Parse mock key structure
      const mockParts = parseMockKey(item.key, tab.url);

      const processedItem = {
        ...item,
        parsedValue,
        isValidJson,
        error,
        mockParts: mockParts || undefined
      };

      console.log('🌐 Chrome: Processed item:', {
        key: processedItem.key,
        valueLength: processedItem.value.length,
        isValidJson: processedItem.isValidJson,
        hasError: !!processedItem.error
      });

      return processedItem;
    })
    .filter(item => {
      // If no search term, return all mock items
      if (!searchTerm.trim()) return true;

      // Search in the API name if mock parts exist
      if (item.mockParts?.api) {
        return item.mockParts.api.toLowerCase().includes(searchTerm.toLowerCase());
      }

      // Fallback to searching in the full key
      return item.key.toLowerCase().includes(searchTerm.toLowerCase());
    });
}

/**
 * Updates a localStorage item in the current tab
 */
export async function updateLocalStorageItem(key: string, value: string): Promise<void> {
  const tab = await getCurrentTab();
  if (!tab) {
    throw new Error('No active tab found');
  }

  // Validate JSON before updating
  try {
    JSON.parse(value);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  await executeInTab(tab.id, (...args: unknown[]) => {
    const key = args[0] as string;
    const value = args[1] as string;
    localStorage.setItem(key, value);
  }, key, value);
}

export async function deleteLocalStorageItem(key: string): Promise<void> {
  const tab = await getCurrentTab();
  if (!tab) {
    throw new Error('No active tab found');
  }

  await executeInTab(tab.id, (...args: unknown[]) => {
    const key = args[0] as string;
    localStorage.removeItem(key);
  }, key);
}

/**
 * Applies a favorite item to localStorage with updated dates
 */
export async function applyFavoriteToLocalStorage(oldKey: string, newKey: string, value: string): Promise<void> {
  const tab = await getCurrentTab();
  if (!tab) {
    throw new Error('No active tab found');
  }

  // Validate JSON before applying
  try {
    JSON.parse(value);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  await executeInTab(tab.id, (...args: unknown[]) => {
    const oldKey = args[0] as string;
    const newKey = args[1] as string;
    const value = args[2] as string;

    // Remove old key if it exists and is different from new key
    if (oldKey !== newKey && localStorage.getItem(oldKey)) {
      localStorage.removeItem(oldKey);
    }

    // Set the new item
    localStorage.setItem(newKey, value);
  }, oldKey, newKey, value);
}

/**
 * Refreshes the current tab
 */
export async function refreshCurrentTab(): Promise<void> {
  const tab = await getCurrentTab();
  if (!tab) {
    throw new Error('No active tab found');
  }

  await chrome.tabs.reload(tab.id);
}

/**
 * Clears all localStorage items with "mock_" prefix from the current tab
 */
export async function clearAllMocks(): Promise<number> {
  const tab = await getCurrentTab();
  if (!tab) {
    throw new Error('No active tab found');
  }

  const deletedCount = await executeInTab(tab.id, () => {
    const keysToDelete: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mock_')) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => localStorage.removeItem(key));
    return keysToDelete.length;
  });

  return deletedCount;
}

/**
 * Formats JSON string with proper indentation
 */
export function formatJson(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return jsonString;
  }
}

/**
 * Save an item to Chrome's local storage as a favorite
 */
export async function saveItemToFavorites(key: string, item: LocalStorageItem, displayName: string): Promise<void> {
  console.log('Chrome: Saving item to favorites:', { key, displayName, mockParts: item.mockParts });

  const dateFilterOption = calculateDateFilterOption(item.mockParts?.startDate, item.mockParts?.endDate);
  const isTimeless = item.mockParts?.isTimeless ?? false;

  const favoriteItem: FavoriteItem = {
    key,
    value: item,
    displayName,
    savedAt: new Date().toISOString(),
    dateFilterOption,
    isTimeless
  };

  const storageKey = `genni_favorite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  if (!chrome?.storage?.local) {
    throw new Error('Chrome storage API is not available. Make sure the extension has storage permissions.');
  }

  try {
    await chrome.storage.local.set({ [storageKey]: favoriteItem });
    console.log('Chrome: Successfully saved item to favorites:', storageKey, 'with date filter:', dateFilterOption);
  } catch (error) {
    console.error('Chrome: Failed to save to favorites:', error);
    throw new Error(`Failed to save item to favorites: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all saved favorite items from Chrome's local storage
 */
export async function getFavoriteItems(): Promise<FavoriteItem[]> {
  try {
    // Check if chrome.storage is available
    if (!chrome?.storage?.local) {
      console.warn('🌐 Chrome: Chrome storage API not available, returning empty favorites');
      return [];
    }

    const result = await chrome.storage.local.get(null);
    const favorites = Object.entries(result)
      .filter(([key]) => key.startsWith('genni_favorite_'))
      .map(([, value]) => value as FavoriteItem)
      .sort((a: FavoriteItem, b: FavoriteItem) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

    console.log('🌐 Chrome: Retrieved favorites:', favorites.length);
    return favorites;
  } catch (error) {
    console.error('🌐 Chrome: Failed to get favorites:', error);
    throw new Error('Failed to retrieve favorite items');
  }
}

/**
 * Update a favorite item in Chrome's local storage
 */
export async function updateFavoriteItem(originalKey: string, newValue: string): Promise<void> {
  try {
    console.log('🌐 Chrome: Updating favorite item:', originalKey);

    // Get all storage items to find the favorite
    const result = await chrome.storage.local.get(null);
    const favoriteEntry = Object.entries(result).find(([, value]) => {
      const favorite = value as FavoriteItem;
      return favorite.key === originalKey;
    });

    if (!favoriteEntry) {
      throw new Error('Favorite item not found');
    }

    const [storageKey, favoriteItem] = favoriteEntry;
    const updatedFavorite: FavoriteItem = {
      ...favoriteItem as FavoriteItem,
      value: {
        ...(favoriteItem as FavoriteItem).value,
        value: newValue,
        parsedValue: JSON.parse(newValue),
        isValidJson: true
      }
    };

    await chrome.storage.local.set({ [storageKey]: updatedFavorite });
    console.log('🌐 Chrome: Successfully updated favorite item');
  } catch (error) {
    console.error('🌐 Chrome: Failed to update favorite:', error);
    throw new Error(`Failed to update favorite item: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a favorite item from Chrome's local storage
 */
export async function deleteFavoriteItem(originalKey: string): Promise<void> {
  try {
    console.log('🌐 Chrome: Deleting favorite item:', originalKey);

    // Get all storage items to find the favorite
    const result = await chrome.storage.local.get(null);
    const favoriteEntry = Object.entries(result).find(([, value]) => {
      const favorite = value as FavoriteItem;
      return favorite.key === originalKey;
    });

    if (!favoriteEntry) {
      throw new Error('Favorite item not found');
    }

    const [storageKey] = favoriteEntry;
    await chrome.storage.local.remove(storageKey);
    console.log('🌐 Chrome: Successfully deleted favorite item');
  } catch (error) {
    console.error('🌐 Chrome: Failed to delete favorite:', error);
    throw new Error(`Failed to delete favorite item: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export all favorites to a JSON file
 */
export async function exportFavorites(): Promise<void> {
  try {
    const favorites = await getFavoriteItems();

    if (favorites.length === 0) {
      console.log('🌐 Chrome: No favorites to export');
      return;
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      favorites: favorites
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = `genni-favorites-${new Date().toISOString().split('T')[0]}.json`;

    await chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    });
    console.log('🌐 Chrome: Successfully exported via Chrome Downloads API');

    // Clean up the URL object
    URL.revokeObjectURL(url);

    console.log('🌐 Chrome: Successfully exported', favorites.length, 'favorites');
  } catch (error) {
    console.error('🌐 Chrome: Failed to export favorites:', error);
    throw new Error(`Failed to export favorites: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Import favorites from a JSON file
 */
export async function importFavorites(file: File): Promise<number> {
  try {
    const text = await file.text();
    const importData = JSON.parse(text);

    // Validate the import data structure
    if (!importData.favorites || !Array.isArray(importData.favorites)) {
      throw new Error('Invalid file format: missing or invalid favorites array');
    }

    const favorites = importData.favorites as FavoriteItem[];
    let importedCount = 0;

    // Import each favorite
    for (const favorite of favorites) {
      // Validate favorite structure
      if (!favorite.key || !favorite.value || !favorite.displayName) {
        console.warn('Skipping invalid favorite item:', favorite);
        continue;
      }

      // Create a new storage key to avoid conflicts
      const storageKey = `genni_favorite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Update the savedAt timestamp to current time
      const favoriteToImport: FavoriteItem = {
        ...favorite,
        savedAt: new Date().toISOString()
      };

      await chrome.storage.local.set({ [storageKey]: favoriteToImport });
      importedCount++;
    }

    console.log('🌐 Chrome: Successfully imported', importedCount, 'favorites');
    return importedCount;
  } catch (error) {
    console.error('🌐 Chrome: Failed to import favorites:', error);
    throw new Error(`Failed to import favorites: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

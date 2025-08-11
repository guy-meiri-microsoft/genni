import type { LocalStorageItem, ChromeTabInfo, MockKeyParts } from '../types';

/**
 * Parses a mock key into its component parts
 * Expected format: mock_<api>_<start>_<end>_<id>
 * Example: mock_billingSummary_05/08_12/08_4f91ba29-52bc-ef11-8ee7-000d3a5a9be8
 */
export function parseMockKey(key: string): MockKeyParts | null {
  const parts = key.split('_');
  
  if (parts.length < 2 || parts[0] !== 'mock') {
    return null;
  }

  const result: MockKeyParts = {
    prefix: parts[0],
    api: parts[1] || '',
    rawKey: key
  };

  // If we have more parts, try to identify dates and ID
  if (parts.length >= 3) {
    result.startDate = parts[2];
  }
  if (parts.length >= 4) {
    result.endDate = parts[3];
  }
  if (parts.length >= 5) {
    result.id = parts[4];
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
  const tab = await getCurrentTab();
  if (!tab) {
    throw new Error('No active tab found');
  }

  const items = await executeInTab(tab.id, () => {
    const items: { key: string; value: string }[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mock_')) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          items.push({ key, value });
        }
      }
    }
    
    return items;
  });

  return items
    .map(item => {
      let parsedValue: unknown;
      let isValidJson = false;
      let error: string | undefined;

      try {
        parsedValue = JSON.parse(item.value);
        isValidJson = true;
      } catch (e) {
        error = e instanceof Error ? e.message : 'Invalid JSON';
        isValidJson = false;
      }

      // Parse mock key structure
      const mockParts = parseMockKey(item.key);

      return {
        ...item,
        parsedValue,
        isValidJson,
        error,
        mockParts: mockParts || undefined
      };
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

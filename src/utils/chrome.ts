import type { LocalStorageItem, ChromeTabInfo } from '../types';

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
 * Gets all localStorage items with a specific prefix from the current tab
 */
export async function getLocalStorageItems(prefix: string = 'mock_'): Promise<LocalStorageItem[]> {
  const tab = await getCurrentTab();
  if (!tab) {
    throw new Error('No active tab found');
  }

  const items = await executeInTab(tab.id, (...args: unknown[]) => {
    const prefix = args[0] as string;
    const items: { key: string; value: string }[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          items.push({ key, value });
        }
      }
    }
    
    return items;
  }, prefix);

  return items.map(item => {
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

    return {
      ...item,
      parsedValue,
      isValidJson,
      error
    };
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

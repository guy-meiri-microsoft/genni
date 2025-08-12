export interface MockToggleInfo {
  isEnabled: boolean;
  envId: string | null;
  botId: string | null;
  error?: string;
}

/**
 * Extract environment ID and bot ID from the current URL
 */
export function extractIdsFromUrl(url: string): { envId: string | null; botId: string | null } {
  try {
    // Pattern: https://<base_url>.com/environments/<env_id>/bots/<bot_id>
    // or: https://<base_url>.com/environments/<env_id>
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    let envId: string | null = null;
    let botId: string | null = null;
    
    // Find environments index
    const envIndex = pathParts.findIndex(part => part === 'environments');
    if (envIndex !== -1 && envIndex + 1 < pathParts.length) {
      envId = pathParts[envIndex + 1];
    }
    
    // Find bots index
    const botsIndex = pathParts.findIndex(part => part === 'bots');
    if (botsIndex !== -1 && botsIndex + 1 < pathParts.length) {
      botId = pathParts[botsIndex + 1];
    }
    
    return { envId, botId };
  } catch (error) {
    console.error('Error extracting IDs from URL:', error);
    return { envId: null, botId: null };
  }
}

/**
 * Get the current mock toggle state for the current environment/bot
 */
export async function getMockToggleState(tabUrl: string): Promise<MockToggleInfo> {
  try {
    const { envId, botId } = extractIdsFromUrl(tabUrl);
    
    if (!envId) {
      return {
        isEnabled: false,
        envId: null,
        botId: null,
        error: 'No environment ID found in URL'
      };
    }
    
    // Get current useMockApis value
    const tab = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab[0]?.id) {
      throw new Error('No active tab found');
    }
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab[0].id },
      func: () => {
        return localStorage.getItem('useMockApis') || '';
      }
    });
    
    const useMockApis = results[0]?.result || '';
    const mockIds = useMockApis.split(',').filter(id => id.trim().length > 0);
    
    // Check if both environment and bot IDs are enabled (if bot exists)
    const envEnabled = mockIds.includes(envId);
    const botEnabled = botId ? mockIds.includes(botId) : true; // If no botId, consider it enabled
    const isEnabled = envEnabled && botEnabled;
    
    return {
      isEnabled,
      envId,
      botId,
    };
  } catch (error) {
    return {
      isEnabled: false,
      envId: null,
      botId: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Toggle mock state for the current environment/bot
 */
export async function toggleMockState(tabUrl: string): Promise<MockToggleInfo> {
  try {
    const { envId, botId } = extractIdsFromUrl(tabUrl);
    
    if (!envId) {
      throw new Error('No environment ID found in URL');
    }
    
    const tab = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab[0]?.id) {
      throw new Error('No active tab found');
    }
    
    
    // Toggle the mock state
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab[0].id },
      func: (envId: string, botId: string | null) => {
        const useMockApis = localStorage.getItem('useMockApis') || '';
        let mockIds = useMockApis.split(',').filter(id => id.trim().length > 0);
        
        // Check current state - both envId and botId (if exists) should be present
        const envEnabled = mockIds.includes(envId);
        const botEnabled = botId ? mockIds.includes(botId) : true;
        const currentlyEnabled = envEnabled && botEnabled;
        
        if (currentlyEnabled) {
          // Remove both IDs
          mockIds = mockIds.filter(id => id !== envId && id !== botId);
        } else {
          // Add both IDs (if they're not already present)
          if (!mockIds.includes(envId)) {
            mockIds.push(envId);
          }
          if (botId && !mockIds.includes(botId)) {
            mockIds.push(botId);
          }
        }
        
        const newValue = mockIds.join(',');
        localStorage.setItem('useMockApis', newValue);
        
        // Check final state
        const finalEnvEnabled = mockIds.includes(envId);
        const finalBotEnabled = botId ? mockIds.includes(botId) : true;
        const finalEnabled = finalEnvEnabled && finalBotEnabled;
        
        return {
          newValue,
          isEnabled: finalEnabled
        };
      },
      args: [envId, botId]
    });
    
    const result = results[0]?.result;
    
    return {
      isEnabled: result?.isEnabled || false,
      envId,
      botId
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to toggle mock state');
  }
}

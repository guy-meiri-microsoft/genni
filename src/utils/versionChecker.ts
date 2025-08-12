export interface VersionInfo {
  currentVersion: string;
  latestVersion: string;
  isUpToDate: boolean;
  hasError: boolean;
  errorMessage?: string;
}

// Get the current version from the extension manifest
const getCurrentVersion = (): string => {
  try {
    // For Chrome extensions, read version from the runtime manifest
    const manifest = chrome.runtime.getManifest();
    return manifest.version;
  } catch (error) {
    console.warn('🔍 VersionChecker: Could not read manifest version:', error);
    return '1.0.0'; // Fallback version
  }
};

export async function checkForUpdates(): Promise<VersionInfo> {
  const currentVersion = getCurrentVersion();
  const githubUrl = 'https://raw.githubusercontent.com/guy-meiri-microsoft/genni/main/public/manifest.json';
  
  try {
    console.log('🔍 VersionChecker: Checking for updates...');
    console.log('🔍 VersionChecker: Current version:', currentVersion);
    
    const response = await fetch(githubUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    
    const remoteManifest = await response.json();
    const latestVersion = remoteManifest.version;
    
    console.log('🔍 VersionChecker: Latest version from GitHub:', latestVersion);
    
    // Show update needed if versions don't match (regardless of which is newer)
    const isUpToDate = currentVersion === latestVersion;
    
    return {
      currentVersion,
      latestVersion,
      isUpToDate,
      hasError: false
    };
  } catch (error) {
    console.error('🔍 VersionChecker: Error checking for updates:', error);
    
    return {
      currentVersion,
      latestVersion: currentVersion,
      isUpToDate: true, // Assume up to date if we can't check
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

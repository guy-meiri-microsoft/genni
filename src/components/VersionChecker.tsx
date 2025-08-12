import { useState, useEffect } from 'react';
import { checkForUpdates, type VersionInfo } from '../utils/versionChecker';

export const VersionChecker: React.FC = () => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkVersion = async () => {
      setIsLoading(true);
      try {
        const info = await checkForUpdates();
        setVersionInfo(info);
      } catch (error) {
        console.error('Failed to check version:', error);
        // Set a fallback version info
        setVersionInfo({
          currentVersion: '1.0.0',
          latestVersion: '1.0.0',
          isUpToDate: true,
          hasError: true,
          errorMessage: 'Failed to check for updates'
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkVersion();
  }, []);

  const handleUpdateClick = () => {
    window.open('https://github.com/guy-meiri-microsoft/genni/', '_blank');
  };

  if (isLoading) {
    return (
      <div className="version-checker loading">
        <span className="version-text">Checking for updates...</span>
      </div>
    );
  }

  if (!versionInfo) {
    return null;
  }

  if (versionInfo.hasError) {
    return (
      <div className="version-checker error">
        <span className="version-text">
          v{versionInfo.currentVersion} • Update check failed
        </span>
      </div>
    );
  }

  if (versionInfo.isUpToDate) {
    return (
      <div className="version-checker up-to-date">
        <span className="version-text">
          ✅ v{versionInfo.currentVersion} • Up to date
        </span>
      </div>
    );
  }

  return (
    <div className="version-checker update-available">
      <button 
        className="update-button"
        onClick={handleUpdateClick}
        title={`Update from v${versionInfo.currentVersion} to v${versionInfo.latestVersion}`}
      >
        🔄 v{versionInfo.currentVersion} → v{versionInfo.latestVersion} • Update Available
      </button>
    </div>
  );
};

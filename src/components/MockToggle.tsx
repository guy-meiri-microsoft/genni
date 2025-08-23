import { useState, useEffect } from 'react';
import { getMockToggleState, toggleMockState, type MockToggleInfo } from '../utils/mockToggle';

interface MockToggleProps {
  currentTabUrl: string;
  onToggle?: (isEnabled: boolean) => void;
}

export const MockToggle: React.FC<MockToggleProps> = ({ currentTabUrl, onToggle }) => {
  const [mockInfo, setMockInfo] = useState<MockToggleInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    const loadMockState = async () => {
      try {
        setIsLoading(true);
        const info = await getMockToggleState(currentTabUrl);
        setMockInfo(info);
      } catch (error) {
        console.error('Error loading mock state:', error);
        setMockInfo({
          isEnabled: false,
          envId: null,
          botId: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (currentTabUrl) {
      loadMockState();
    }
  }, [currentTabUrl]);

  const handleToggle = async () => {
    if (!mockInfo || isToggling) return;

    try {
      setIsToggling(true);
      const newInfo = await toggleMockState(currentTabUrl);
      setMockInfo(newInfo);
      onToggle?.(newInfo.isEnabled);
    } catch (error) {
      console.error('Error toggling mock state:', error);
      alert(`Failed to toggle mocks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mock-toggle-switch loading">
        <span className="mock-toggle-slider">
          <span className="mock-toggle-text">⏳</span>
        </span>
      </div>
    );
  }

  if (!mockInfo || mockInfo.error) {
    return (
      <div 
        className="mock-toggle-switch error"
        data-tooltip={mockInfo?.error || 'Unable to determine mock state'}
      >
        <span className="mock-toggle-slider">
          <span className="mock-toggle-text">❌</span>
        </span>
      </div>
    );
  }

  const targetLabel = mockInfo.botId ? 'Bot' : 'Env';
  const targetId = (mockInfo.botId || mockInfo.envId || '').substring(0, 8);

  return (
    <label 
      className={`mock-toggle-switch ${isToggling ? 'toggling' : ''}`}
      data-tooltip={`${mockInfo.isEnabled ? 'Disable' : 'Enable'} mocks for ${targetLabel}: ${targetId}...`}
    >
      <input
        type="checkbox"
        checked={mockInfo.isEnabled}
        onChange={handleToggle}
        disabled={isToggling}
        className="mock-toggle-input"
      />
      <span className="mock-toggle-slider">
        <span className="mock-toggle-text">
          {isToggling ? '...' : mockInfo.isEnabled ? 'ON' : 'OFF'}
        </span>
      </span>
    </label>
  );
};

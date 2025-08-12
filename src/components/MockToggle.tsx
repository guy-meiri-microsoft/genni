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
      <button className="action-btn mock-toggle-btn loading" disabled>
        ⏳ Loading...
      </button>
    );
  }

  if (!mockInfo || mockInfo.error) {
    return (
      <button 
        className="action-btn mock-toggle-btn error" 
        disabled
        title={mockInfo?.error || 'Unable to determine mock state'}
      >
        ❌ Mocks N/A
      </button>
    );
  }

  const targetLabel = mockInfo.botId ? 'Bot' : 'Env';
  const targetId = (mockInfo.botId || mockInfo.envId || '').substring(0, 8);

  return (
    <button
      className={`action-btn mock-toggle-btn ${mockInfo.isEnabled ? 'enabled' : 'disabled'}`}
      onClick={handleToggle}
      disabled={isToggling}
      title={`${mockInfo.isEnabled ? 'Disable' : 'Enable'} mocks for ${targetLabel}: ${targetId}...`}
    >
      {isToggling ? '...' : mockInfo.isEnabled ? 'ON' : 'OFF'}
    </button>
  );
};

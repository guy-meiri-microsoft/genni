import type { MockKeyParts } from '../../types';

interface MockTitleBadgeProps {
  mockParts?: MockKeyParts;
}

export function MockTitleBadge({ mockParts }: MockTitleBadgeProps): React.ReactNode {
  if (!mockParts) return null;

  if (mockParts.startDate && mockParts.endDate) {
    return (
      <span className="date-preview">
        <small> ({mockParts.startDate} &#x2192; {mockParts.endDate})</small>
      </span>
    );
  }

  if (mockParts.isTimeless) {
    return (
      <span className="timeless-badge">
        <small> (no time range)</small>
      </span>
    );
  }

  return null;
}

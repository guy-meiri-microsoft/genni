export interface MockKeyParts {
  prefix: string;      // "mock"
  api: string;         // "billingSummary"
  startDate?: string;  // "05/08"
  endDate?: string;    // "12/08"
  id?: string;         // "4f91ba29-52bc-ef11-8ee7-000d3a5a9be8"
  rawKey: string;      // Full original key
}

export interface LocalStorageItem {
  key: string;
  value: string;
  parsedValue?: unknown;
  isValidJson: boolean;
  error?: string;
  mockParts?: MockKeyParts; // Parsed mock key structure if applicable
}

export interface ChromeTabInfo {
  id: number;
  url: string;
  title: string;
}

export interface LocalStorageManagerProps {
  items: LocalStorageItem[];
  onUpdateItem: (key: string, newValue: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  loading: boolean;
  error?: string;
}

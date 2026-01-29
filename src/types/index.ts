export interface MockKeyParts {
  prefix: string;      // "mock"
  api: string;         // "billingSummary"
  startDate?: string;  // "05/08" (DD/MM format)
  endDate?: string;    // "12/08" (DD/MM format)
  id?: string;         // "4f91ba29-52bc-ef11-8ee7-000d3a5a9be8"
  rawKey: string;      // Full original key
  isTimeless: boolean; // true if mock has no date range (format: mock_<api>)
}

export interface LocalStorageItem {
  key: string;
  value: string;
  parsedValue?: unknown;
  isValidJson: boolean;
  error?: string;
  mockParts?: MockKeyParts; // Parsed mock key structure if applicable
  statusCode?: number; // HTTP status code from { data, statusCode } format
  hasStatusField: boolean; // Whether the value has the { data, statusCode } structure
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

export interface FavoriteItem {
  key: string;
  value: LocalStorageItem;
  displayName: string;
  savedAt: string;
  dateFilterOption: DateFilterOptions;
  isTimeless?: boolean; // true for mocks without time ranges
}

export type ActiveExtensionTab = 
  | {
      type: 'active-mocks';
      items: LocalStorageItem[];
    }
  | {
      type: 'favorites';
      items: FavoriteItem[];
    };

export type DateFilterOptions = 'Last7Days' | 'Last14Days' | 'Last30Days' | 'None';

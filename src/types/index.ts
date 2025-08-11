export interface LocalStorageItem {
  key: string;
  value: string;
  parsedValue?: unknown;
  isValidJson: boolean;
  error?: string;
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

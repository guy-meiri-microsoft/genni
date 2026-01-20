# Genni - Chrome Extension for localStorage Mock Management

## Project Overview

Genni is a Chrome extension for managing and manipulating mock API data stored in localStorage. It provides a UI to view, edit, apply, and organize mock responses with time-based filtering and favorites management.

**Version:** 1.5.6
**Framework:** React + TypeScript
**Build Tool:** Vite
**Target:** Chrome Extension (Manifest V3)

## Core Functionality

### 1. Mock Data Management
- **View Active Mocks**: Display all localStorage items with `mock_` prefix
- **Edit JSON**: In-place JSON editor with syntax highlighting and validation
- **Delete Mocks**: Remove individual mock entries
- **Clear All**: Bulk delete all mock items

### 2. Mock Key Format

Two types of mock keys are supported:

**Time-based (Analytics):**
```
mock_<api>_<startDate>_<endDate>_<id>
Example: mock_billingSummary_05/08_12/08_4f91ba29-52bc-ef11-8ee7-000d3a5a9be8
```

**Timeless (Evaluations):**
```
mock_<api>
Example: mock_userData
```

### 3. Favorites System
- Save mocks as reusable favorites with custom names
- Apply favorites with date range updates (for time-based mocks)
- Date filter options: Last7Days, Last14Days, Last30Days, None
- Export/Import favorites as JSON

### 4. Mock Toggle
- Toggle mocks on/off via localStorage `useMockApis` field
- Automatically adds/removes `?isMock=true` URL parameter
- Works with environment IDs and bot IDs

### 5. UI Organization
- **Active Mocks Tab**: Shows current localStorage mocks
- **Favorites Tab**: Shows saved favorites
- **Analytics Section**: Time-based mocks (with date ranges)
- **Evaluations Section**: Timeless mocks (no date ranges)
- **Collapsible Sections**: Click headers to expand/collapse
- **Floating Navigation**: Quick jump between sections

## Architecture

### Key Directories

```
src/
├── components/          # React components
│   ├── ActiveMocksTab.tsx
│   ├── FavoritesTab.tsx
│   ├── FloatingNavigationMenu.tsx
│   ├── LocalStorageItemComponent.tsx
│   ├── FavoriteItemComponent.tsx
│   ├── BaseItemComponent.tsx
│   ├── MockToggle.tsx
│   └── VersionChecker.tsx
├── utils/               # Utility functions
│   ├── chrome.ts        # Chrome API wrappers
│   ├── dateUtils.ts     # Date manipulation
│   ├── mockToggle.ts    # Mock toggle logic
│   └── textUtils.ts     # Text highlighting
├── styles/              # CSS files
│   ├── tokens.css       # Design system tokens
│   ├── base.css
│   ├── buttons.css
│   ├── states.css
│   ├── tooltips.css
│   └── components/      # Component-specific styles
│       ├── tabs.css
│       ├── floating-nav.css
│       ├── item-card.css
│       └── ...
└── types/
    └── index.ts         # TypeScript interfaces
```

### Core Types

```typescript
// Mock key components
interface MockKeyParts {
  prefix: string;      // "mock"
  api: string;         // API name
  startDate?: string;  // DD/MM format
  endDate?: string;    // DD/MM format
  id?: string;         // Environment/Bot ID
  rawKey: string;      // Full original key
  isTimeless: boolean; // true for Evaluations, false for Analytics
}

// localStorage item
interface LocalStorageItem {
  key: string;
  value: string;
  parsedValue?: unknown;
  isValidJson: boolean;
  error?: string;
  mockParts?: MockKeyParts;
}

// Favorite item
interface FavoriteItem {
  key: string;
  value: LocalStorageItem;
  displayName: string;
  savedAt: string;
  dateFilterOption: DateFilterOptions;
  isTimeless?: boolean;
}

type DateFilterOptions = 'Last7Days' | 'Last14Days' | 'Last30Days' | 'None';
```

## Key Features Implementation

### Date Range Calculation
- `calculateDatesFromFilter()` converts date filter options to DD/MM dates
- Uses UTC to avoid timezone issues
- Inclusive date ranges (7 days = today + 6 previous days)

### Date Updates in Favorites
- When applying a favorite, dates are updated based on selected filter
- Timestamps are mapped proportionally from original to new date range
- Timeless mocks skip all date updates

### Mock Key Parsing
- `parseMockKey()` splits keys by underscore and validates format
- Detects timeless format by checking part count (2 = timeless)
- Validates date format with regex: `/^\d{2}\/\d{2}$/`
- Extracts environment/bot IDs from URL if not in key

### Section Organization
- Items filtered by `isTimeless` property
- Analytics: `items.filter(item => !item.mockParts?.isTimeless)`
- Evaluations: `items.filter(item => item.mockParts?.isTimeless)`

### Collapsible Sections
- State managed with `Set<SectionId>` for collapsed sections
- Click header button to toggle collapse state
- Icons: ▶ (collapsed) / ▼ (expanded)

### Floating Navigation
- Only shows when 2+ sections have items
- Smooth scroll using `scrollIntoView({ behavior: 'smooth' })`
- Auto-closes after navigation or backdrop click
- Fixed position bottom-right corner

## Development Workflow

### Build Commands

```bash
# Development build
npm run build

# Extension build (includes manifest copying)
npm run build:extension

# Development server (not applicable for extensions)
npm run dev
```

### CSS Architecture

**Design System:**
- CSS custom properties in `tokens.css`
- Modular component-specific CSS files
- Consistent spacing/color/radius tokens
- No inline styles (except dynamic)

**Import Order in App.tsx:**
1. Foundation (tokens, base, buttons, states, tooltips)
2. Component styles (header, tabs, items, etc.)

### Component Patterns

**Section Components:**
- Helper components for rendering sections (`MocksSection`, `FavoritesSection`)
- Props include collapse state, toggle handler, and ref for navigation
- Return `null` if no items (hidden)

**Item Components:**
- `BaseItemComponent` for shared functionality (expand/collapse, JSON editing)
- `LocalStorageItemComponent` for active mocks
- `FavoriteItemComponent` for favorites with apply logic

**State Management:**
- React hooks (useState, useEffect, useCallback, useRef)
- No external state management library
- Chrome storage API for persistent data (favorites)

## Chrome Extension Specifics

### Manifest V3
- Service worker background script
- Content script permissions for localStorage access
- Uses `chrome.scripting.executeScript` for page manipulation

### Permissions Required
- `storage` - For favorites persistence
- `tabs` - For tab URL access
- `scripting` - For localStorage manipulation
- `activeTab` - For current tab interaction

### Storage Keys
- `useMockApis` - Comma-separated list of enabled mock IDs (in page localStorage)
- `genni_favorite_*` - Favorite items (in chrome.storage.local)

## Recent Changes (Branch: support-timeless-mocks)

### Timeless Mocks Support (v1.5.3+)
- Added support for `mock_<api>` format (no date ranges)
- Split UI into Analytics/Evaluations sections
- Updated type system with `isTimeless` flag
- Modified date utilities to skip timeless mocks

### Collapsible Sections (Latest)
- Added clickable section headers with expand/collapse
- Floating navigation menu with smooth scroll
- Section state management with Set
- New FloatingNavigationMenu component

### Mock Toggle URL Parameter (Latest)
- Added `?isMock=true` URL parameter when mocks enabled
- Removed parameter when mocks disabled
- Uses `window.history.replaceState` for seamless updates

## Testing Considerations

### Manual Testing Steps
1. Create mock items in localStorage:
   - Time-based: `localStorage.setItem('mock_api_01/01_07/01_abc', '{"data":"test"}')`
   - Timeless: `localStorage.setItem('mock_userData', '{"user":"test"}')`
2. Verify sections appear correctly (Analytics vs Evaluations)
3. Test collapse/expand functionality
4. Test floating navigation menu
5. Save to favorites and apply with different date filters
6. Test mock toggle with URL parameter updates
7. Export/import favorites

### Edge Cases
- Empty sections (should not render)
- Invalid JSON in mock values (should show error)
- Malformed mock keys (should handle gracefully)
- Missing environment/bot ID in URL
- Single section visible (floating nav should hide)
- Search filtering across sections

## Code Conventions

### TypeScript
- Explicit return types for functions
- Interface over type for object shapes
- Use `React.FC` sparingly (prefer function declarations)
- Avoid `any` type - use `unknown` with type guards

### React
- Named function exports over arrow functions for components
- Hooks at component top level
- Destructure props in function signature
- Use optional chaining (`?.`) for nested properties

### CSS
- BEM-like naming without strict BEM rules
- Kebab-case for class names
- CSS variables for all design tokens
- Component-specific files over global styles

### Git Commits
- Descriptive commit messages with context
- Co-authored attribution for AI assistance
- Separate commits for distinct features

## Known Issues / Future Considerations

- Zip creation fails on Windows (requires manual zip)
- No persistence for section collapse state (could add)
- No keyboard shortcuts for navigation (could add)
- Search only works on API name, not full key/value content
- No dark mode support

## Resources

- Chrome Extension Docs: https://developer.chrome.com/docs/extensions/
- React Docs: https://react.dev/
- TypeScript Handbook: https://www.typescriptlang.org/docs/

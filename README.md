# LocalStorage JSON Manager - Chrome/Edge Extension

A Chrome/Edge browser extension built with TypeScript, React, and Vite to help manage localStorage JSON values with specific prefixes.

## Features

- 🔍 **Filter by Prefix**: Display localStorage items that match a specific prefix (default: "mock_")
- 📝 **JSON Editor**: Built-in JSON editor with syntax validation and formatting
- ✅ **Real-time Validation**: Instant JSON validation with error messages
- 🔄 **Auto-refresh**: Automatically reload data after changes
- 🎨 **Clean UI**: Modern, responsive interface designed for developer productivity
- 🛡️ **Type Safe**: Built with TypeScript for better code quality

## Use Case

This extension is perfect for developers who:
- Store JSON configuration data in localStorage
- Use naming conventions like "mock_" prefixes for test data
- Need to quickly edit JSON values without manual copy/paste workflows
- Want a user-friendly alternative to browser DevTools for localStorage management

## Installation

### Development

1. Clone and build the extension:
```bash
npm install
npm run build:extension
```

2. Load the extension in Chrome/Edge:
   - Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### Usage

1. Navigate to any webpage that has localStorage items with your chosen prefix
2. Click the extension icon in the toolbar
3. The popup will display all localStorage items matching the prefix
4. Click "Edit" on any item to modify its JSON value
5. Use the built-in JSON formatter and validator
6. Save changes to update the localStorage directly

## Project Structure

```
src/
├── components/           # React components
│   ├── JsonEditor.tsx   # JSON editing component
│   └── LocalStorageItemComponent.tsx
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions
│   └── chrome.ts        # Chrome extension API helpers
├── App.tsx              # Main application component
├── App.css              # Styles
└── main.tsx             # Application entry point

public/
├── manifest.json        # Chrome extension manifest
└── icons/               # Extension icons (placeholders)
```

## Development Scripts

- `npm run dev` - Start development server with Vite
- `npm run build` - Build the React application
- `npm run build:extension` - Build and prepare extension for Chrome/Edge
- `npm run lint` - Run ESLint for code quality

## Technical Details

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7.x for fast development and optimized builds
- **Extension API**: Chrome Extension Manifest V3
- **Permissions**: `activeTab`, `scripting` for localStorage access
- **CSS**: Custom styles optimized for extension popup (500x600px)

## Browser Compatibility

- ✅ Chrome (Manifest V3)
- ✅ Microsoft Edge (Manifest V3)
- ✅ Other Chromium-based browsers

## Security

The extension only requests minimal permissions:
- `activeTab`: Access to the currently active tab
- `scripting`: Execute scripts to read/write localStorage
- No network permissions or broad site access

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run build:extension`
5. Submit a pull request

## Notes

- Remember to create actual PNG icon files in `public/icons/` before publishing
- The extension works only on pages that have localStorage items with your specified prefix
- JSON validation prevents saving invalid data to localStorage

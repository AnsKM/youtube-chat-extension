# YouTube Chat Extension - Project Structure

## 📁 Directory Layout

```
youtube_chat_extension/
├── 📄 README.md              # Main project documentation
├── 📄 CLAUDE.md              # AI assistant context file
├── 📄 manifest.json          # Chrome extension manifest
├── 📄 package.json           # Node.js dependencies
│
├── 📁 assets/                # Static assets
│   └── 📁 icons/             # Extension icons (16x16, 32x32, 128x128)
│
├── 📁 background/            # Service worker scripts
│   └── service-worker.js     # Handles API calls and messaging
│
├── 📁 content/               # Content scripts and styles
│   ├── content-script-simple.js  # Main extension logic
│   ├── transcript-fetcher.js     # YouTube transcript extraction
│   └── styles.css               # Minimal UI styles
│
├── 📁 popup/                 # Extension popup interface
│   ├── popup.html           # Settings UI
│   ├── popup.js             # API key management
│   └── popup.css            # Popup styling
│
├── 📁 design/                # Design documentation
│   ├── MINIMAL_UI_IMPLEMENTATION_SUMMARY.md  # Current design system
│   ├── image.png            # Design reference
│   └── 📁 archive/          # Previous design iterations
│
├── 📁 docs/                  # Documentation
│   ├── CHANGELOG.md         # Version history
│   ├── QUICK_REFERENCE.md   # Quick usage guide
│   └── 📁 guides/           # Detailed guides
│       ├── CHAT_MANAGEMENT_GUIDE.md
│       ├── HISTORY_FEATURE_GUIDE.md
│       ├── INTERACTIVE_CHAT_GUIDE.md
│       └── ...
│
├── 📁 tools/                 # Development tools
│   ├── create-icons.js      # Icon generation script
│   ├── debug-api-response.js
│   ├── debug-transcript.js
│   └── ...
│
└── 📁 debugging/             # Debug resources
    └── 📁 archive/           # Historical debug docs

```

## 🎯 Key Files

### Core Extension Files
- **manifest.json** - Extension configuration
- **service-worker.js** - Background script for API handling
- **content-script-simple.js** - Main UI and interaction logic
- **transcript-fetcher.js** - YouTube transcript extraction
- **styles.css** - Minimal, clean UI styles

### User Interface
- **popup.html/js/css** - Extension settings popup
- **content/styles.css** - Chat interface styling

### Documentation
- **README.md** - User-facing documentation
- **CLAUDE.md** - Development context for AI assistants
- **docs/guides/** - Detailed implementation guides

## 🚀 Quick Start

1. Load extension in Chrome via `chrome://extensions/`
2. Add Gemini API key via extension popup
3. Navigate to YouTube video
4. Chat interface appears automatically

## 📝 Notes

- Using simple scripts (no webpack/module bundling)
- Minimal UI design for productivity focus
- All core functionality in single files for easier debugging
- Chrome Storage API for persistence
- Gemini 2.5 Flash Preview for AI responses
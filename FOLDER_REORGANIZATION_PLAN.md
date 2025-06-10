# YouTube Chat Extension - Folder Reorganization Plan

## Current Issues
- Duplicate documentation files in root and /docs
- Multiple ZIP files cluttering the root
- Scattered markdown files without clear organization
- Mixed debug/archive files with main code

## New Organized Structure

```
youtube_chat_extension/
├── README.md                    # Main project documentation
├── manifest.json               # Chrome extension manifest
├── package.json               # NPM dependencies
├── .gitignore                 # Git ignore file
│
├── src/                       # Source code
│   ├── background/           # Background scripts
│   │   ├── service-worker.js
│   │   └── api-handler.js
│   ├── content/              # Content scripts
│   │   ├── content-script.js
│   │   ├── transcript-fetcher.js
│   │   └── styles.css
│   ├── popup/                # Extension popup
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── smart-router/         # Smart Query Router system
│   │   ├── smart-query-router.js
│   │   ├── query-classifier.js
│   │   ├── cache-manager.js
│   │   ├── cost-tracker.js
│   │   ├── simple-rag.js
│   │   └── enhanced-rag.js
│   └── utils/                # Utility modules
│       └── usage-tracker.js
│
├── assets/                    # Static assets
│   ├── icons/                # Extension icons
│   └── screenshots/          # Store screenshots
│
├── docs/                      # All documentation
│   ├── setup/                # Setup and installation
│   │   ├── INSTALLATION.md
│   │   └── CONFIGURATION.md
│   ├── smart-router/         # Smart Router documentation
│   │   ├── OVERVIEW.md
│   │   ├── IMPLEMENTATION.md
│   │   └── API_REFERENCE.md
│   ├── development/          # Development guides
│   │   ├── CONTRIBUTING.md
│   │   ├── TESTING.md
│   │   └── DEBUGGING.md
│   ├── deployment/           # Deployment guides
│   │   ├── CHROME_STORE_GUIDE.md
│   │   └── RELEASE_CHECKLIST.md
│   └── marketing/            # Marketing materials
│       ├── LANDING_PAGE.md
│       └── REDDIT_STRATEGY.md
│
├── demo/                      # Demo and examples
│   ├── README.md
│   ├── console-demo.html
│   └── examples/
│
├── tools/                     # Development tools
│   ├── build/
│   └── debug/
│
├── tests/                     # Test files
│   ├── unit/
│   └── integration/
│
├── dist/                      # Build output (gitignored)
└── archives/                  # Old versions (gitignored)
    └── *.zip
```

## Files to Move/Rename

### Root Level Cleanup
- Move all *.zip files → `/archives/`
- Move CLAUDE.md → `/docs/AI_ASSISTANT_GUIDE.md`
- Move PROJECT_STRUCTURE.md → `/docs/ARCHITECTURE.md`
- Consolidate duplicate docs files

### Documentation Consolidation
- ✅ Merged duplicate PRACTICAL_IMPLEMENTATION_GUIDE.md files (kept smart-router version)
- ✅ Merged duplicate ADVANCED_COST_REDUCTION_STRATEGIES.md files (kept smart-router version)
- Organize marketing docs into marketing folder
- Note: Smart Router documentation is now centralized in `/docs/smart-router/`

### Source Code Organization
- Move background scripts to `/src/background/`
- Move content scripts to `/src/content/`
- Move popup files to `/src/popup/`
- Create `/src/smart-router/` for all Smart Router components

## Benefits
1. Clear separation of concerns
2. Easy to find files
3. Better for version control
4. Professional structure
5. Easier onboarding for new developers
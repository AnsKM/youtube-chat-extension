# Changelog

All notable changes to the YouTube Chat Extension will be documented in this file.

## [Unreleased] - 2025-01-10

### Changed
- Refined minimal UI design for more polished appearance
- Updated header title from "YouTube Chat Assistant" to "YouTube Chat"
- Improved typography with better font weights and spacing
- Enhanced message bubbles with better padding and contrast
- Polished input area with cleaner borders and pill-shaped send button
- Implemented consistent 8px spacing grid throughout interface
- Styled emoji buttons to blend better with header navigation

### Improved
- Better visual hierarchy with refined typography
- Smoother hover states without distracting animations
- Cleaner focus indicators for better accessibility
- More professional appearance while maintaining minimal philosophy

### Fixed
- Chat bubble now appears correctly on YouTube pages
- Chat history loading and display functionality
- API key check no longer blocks UI initialization

## [1.1.0] - 2025-06-08

### Added
- **Export Chat functionality** with 3 format options:
  - Markdown (.md) - Best for documentation with rich formatting
  - JSON (.json) - Structured data for developers & analysis
  - Plain Text (.txt) - Simple, readable format
- Export dialog with intuitive format selection
- Visual feedback on successful export
- Comprehensive marketing strategy documentation:
  - MARKETING_STRATEGY.md - Overall approach and positioning
  - REDDIT_LAUNCH_PLAYBOOK.md - Detailed Reddit acquisition strategy
  - LANDING_PAGE_COPY.md - Complete landing page copywriting
  - FIRST_1000_USERS_STRATEGY.md - Tactical 30-day user acquisition plan
  - SEO_CONTENT_STRATEGY.md - 90-day SEO and content marketing plan

### Changed
- Increased output token limit from 2500 to 3500
- Added explicit 3000 token soft limit in AI prompt to prevent cutoffs
- Refined minimal UI design based on user feedback
- Updated documentation to reflect new features

### Technical Improvements
- Export functionality includes video metadata (title, URL, timestamp)
- Export filenames include timestamp for easy organization
- Added proper MIME types for each export format
- Smooth animations for export dialog and success messages

## [1.0.0] - 2025-06-07

### Added
- Initial release with full core functionality
- AI-powered chat using Gemini 2.5 Flash Preview (`models/gemini-2.5-flash-preview-05-20`)
- Full YouTube transcript fetching with 4 methods:
  - DOM scraping from transcript panel
  - YouTube Player API
  - Page data extraction
  - TimedText API fallback
- Interactive conversational interface with memory
- Chat persistence per video
- Chat history panel with:
  - Search functionality
  - Load previous conversations
  - Delete conversations
  - Visual indicators for current video
- New Chat button (saves before clearing)
  - Clear Chat button (immediate clear)
- Dark mode support
- Minimize/maximize functionality
- 1M token context window support for long videos

### Fixed
- History panel now properly hidden by default
- Close button (×) now works correctly
- Chat saving to history now functions properly
- Response cut-off issues resolved
- CSS positioning issues with transform

### Technical Details
- Chrome Extension Manifest V3
- Vanilla JavaScript (ES6+)
- Chrome Storage API for persistence
- CSS with !important flags for reliable UI state
- Global debugging access via `window.ytChatExtension`

### Known Limitations
- Embedded video support not yet implemented
- Timestamp clicking not yet implemented
- Export functionality planned for future release

## Development History

### Phase 1 (Foundation) - Completed
- ✅ Chrome extension structure
- ✅ Transcript retrieval ported to JavaScript
- ✅ Gemini API client implemented
- ✅ Basic chat UI created

### Phase 2 (Core Features) - Completed
- ✅ Video detection system
- ✅ Chat persistence with Chrome storage
- ✅ Settings/popup interface
- ✅ Error handling

### Phase 3 (Memory & Management) - Completed
- ✅ Smart chat history management
- ✅ New chat functionality
- ✅ Clear chat option
- ✅ Performance optimization

### Debugging Journey (June 7, 2025)
1. **Initial Issues**:
   - Model name confusion (corrected to use `gemini-2.5-flash-preview-05-20`)
   - Missing embed-detector.js file
   - API connection errors

2. **Transcript Fetching**:
   - Started with "No transcript available"
   - Implemented 4 different fetching methods
   - Successfully loads 500+ segments

3. **Response Quality**:
   - Fixed cut-off responses by increasing maxOutputTokens
   - Improved markdown parsing
   - Added conversation context

4. **UI/UX Fixes**:
   - History panel visibility issues (multiple approaches)
   - Event listener problems
   - CSS transform to left positioning migration
   - Added visibility property for extra reliability

### Testing Notes
- Tested on YouTube videos ranging from 5 minutes to 3+ hours
- Verified persistence across browser sessions
- Confirmed dark mode compatibility
- Validated search functionality in history panel

---

**Next Release**: v1.1.0 planned with timestamp support and export functionality
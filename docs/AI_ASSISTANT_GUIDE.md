# YouTube Chat Extension - AI Assistant Guide

This file contains important context and instructions for AI assistants working on the YouTube Chat Extension project.

## Project Overview

A Chrome extension that enables AI-powered conversations with YouTube videos using Gemini 2.5 Flash Preview's 1M token context window. Works on both YouTube.com and embedded videos across the web.

## Key Technical Details

### Model Specification
- **MUST USE**: `models/gemini-2.5-flash-preview-05-20`
- **Context Window**: 1 million tokens (can handle 10+ hour videos)
- **API Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models`

### Core Technologies
- **Extension**: Chrome Manifest V3
- **Language**: JavaScript/TypeScript
- **Storage**: Chrome Storage API (local)
- **UI Framework**: Vanilla JS with CSS (keep it lightweight)
- **Build Tool**: Webpack or Vite
- **Testing**: Jest for unit tests

## Reusable Components from Main Codebase

### 1. Transcript Retrieval Logic
**Source**: `/projects/youtube_educator/src/transcript_retriever.py`
- Port `extract_video_id()` regex patterns to JavaScript
- Adapt transcript fetching logic for browser environment
- Keep multi-language support

### 2. Gemini Client Pattern
**Source**: `/core/ai/gemini_client.py`
- Port conversation management logic
- Adapt API calls for browser (handle CORS)
- Maintain conversation history structure

### 3. Web Helpers
**Source**: `/core/utils/web_helpers.py`
- Use YouTube URL parsing patterns
- Port video ID extraction logic

## Project Structure
```
youtube_chat_extension/
├── manifest.json          # Chrome extension manifest V3
├── background/
│   ├── service-worker.js  # Background script for API calls
│   └── api-handler.js     # Gemini API integration
├── content/
│   ├── content-script.js  # Main injection script
│   ├── chat-ui.js         # UI components
│   └── styles.css         # Extension styles
├── lib/
│   ├── transcript.js      # YouTube transcript fetcher
│   ├── gemini-client.js   # Gemini API client
│   ├── storage.js         # Chrome storage wrapper
│   └── utils.js           # Helper functions
├── popup/
│   ├── popup.html         # Extension popup
│   ├── popup.js           # Settings management
│   └── popup.css          # Popup styles
├── assets/
│   └── icons/             # Extension icons (16, 48, 128px)
└── tests/
    └── *.test.js          # Unit tests
```

## Development Guidelines

### Phase 1 Focus (Current)
1. **Basic Chrome extension setup** with Manifest V3
2. **Port transcript retrieval** from Python to JavaScript
3. **Implement Gemini API client** with proper error handling
4. **Create minimal chat UI** that doesn't obstruct video

### Code Standards
1. **Use ES6+ features** (async/await, modules, destructuring)
2. **Type safety**: Add JSDoc comments for better IDE support
3. **Error handling**: Always catch and display user-friendly errors
4. **Performance**: Lazy load components, minimize DOM operations

### Security Requirements
1. **API Key Storage**: Use Chrome's encrypted storage
2. **Content Security Policy**: Strict CSP in manifest
3. **Input Sanitization**: Sanitize all user inputs
4. **HTTPS Only**: All external requests over HTTPS

### UI/UX Principles
1. **Non-intrusive**: Floating UI that can be minimized
2. **Responsive**: Adapt to different video player sizes
3. **Fast**: <100ms UI response time
4. **Accessible**: Keyboard navigation support

## Common Pitfalls to Avoid

1. **Don't use Python-specific libraries** - Find JS equivalents
2. **Don't make API calls from content scripts** - Use background script
3. **Don't store sensitive data in localStorage** - Use chrome.storage
4. **Don't block the main thread** - Use Web Workers if needed
5. **Don't assume YouTube's DOM structure** - It changes frequently

## Testing Approach

1. **Manual Testing URLs**:
   - YouTube: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - Embedded: Any blog with YouTube embeds
   - Short video: For quick iteration
   - Long video (3+ hours): For context window testing

2. **Test Cases**:
   - Video detection on page load
   - Video change detection (YouTube SPA navigation)
   - Embedded video detection
   - Transcript fetching (multiple languages)
   - Chat persistence across sessions
   - Error handling (no transcript, API errors)

## API Integration Notes

### YouTube Transcript Fetching
```javascript
// Since youtube-transcript-api is Python-only, we need to:
1. Scrape the YouTube page for caption data
2. Parse the timedtext API URL
3. Fetch and parse the XML transcript
4. Handle errors gracefully
```

### Gemini API Call Pattern
```javascript
const response = await fetch(
  `${BASE_URL}/${MODEL_NAME}:generateContent?key=${API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: messages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    })
  }
);
```

## Performance Optimization

1. **Transcript Caching**: Cache in chrome.storage with expiry
2. **Streaming Responses**: Use streaming API if available
3. **Debounce User Input**: 300ms debounce on typing
4. **Lazy Loading**: Load UI components on demand
5. **Background Processing**: Offload heavy work to service worker

## Debugging Tips

1. **Chrome DevTools**: Use debugger statements
2. **Extension Logs**: Check chrome://extensions errors
3. **Network Tab**: Monitor API calls
4. **Storage Inspector**: Check chrome.storage data

## Current Status Tracking

When implementing features, update status here:
- [x] Manifest.json created
- [x] Basic extension structure
- [x] Transcript fetching works (4 methods: DOM, Player API, Page Data, TimedText)
- [x] Gemini API integrated
- [x] Chat UI functional
- [x] Storage implemented (conversation persistence)
- [x] Video detection working
- [x] Chat history panel with search
- [x] New chat and clear chat functionality
- [x] Timestamp support (click to seek in video)
- [x] Fixed timestamp bug - timestamps in lists now clickable
- [x] Chrome Web Store submission completed (under review)
- [ ] Embedded video support

### Recent Enhancements (June 7-8, 2025):
- [x] Interactive conversational experience with memory
- [x] Balanced response lengths (2-3 paragraphs)
- [x] Markdown formatting support
- [x] Conversation persistence per video
- [x] Previous session restoration
- [x] Enhanced error handling
- [x] Context management (last 3 exchanges)
- [x] Chat history panel with:
  - Search functionality
  - Load previous conversations
  - Delete conversations
  - Visual indicators for current video
- [x] New Chat button (saves before clearing)
- [x] Clear Chat button (immediate clear)
- [x] Fixed persistent UI issues:
  - History panel hidden by default
  - Close button working properly
  - Proper save functionality
- [x] Dynamic response length based on query complexity
- [x] Timestamp support with click-to-seek functionality
- [x] Minimal UI/UX redesign:
  - Clean, distraction-free interface
  - Subtle shadows and animations
  - Professional appearance
- [x] Copy to clipboard feature:
  - Hover to reveal copy button
  - Visual feedback on copy
  - Works with all response formats
- [x] Increased token limit:
  - 3500 max output tokens
  - 3000 soft limit in prompt
  - Better handling of long responses

### June 8, 2025 Updates:
- [x] Fixed critical timestamp bug where timestamps in lists weren't clickable
  - Moved processTimestamps() to execute BEFORE markdown formatting
  - Ensures all timestamps are converted to clickable links
- [x] Chrome Web Store submission completed
  - Created extension ZIP file
  - Filled out all listing details with SEO optimization
  - Created privacy policy
  - Submitted for review
- [x] Reddit karma building system created:
  - REDDIT_KARMA_BUILDER.md - Master guide with personas
  - QUICK_KARMA_PROMPTS.md - Copy-paste ready prompts
  - SUBREDDIT_CULTURE_GUIDE.md - Deep analysis of target communities
- [x] Generated authentic Reddit responses for 4 posts across different subreddits
- [x] Fixed fullscreen bug (1:00 AM):
  - Chat auto-hides when entering fullscreen
  - Restores previous state when exiting
  - Works with F key, button click, and YouTube-specific fullscreen
- [x] Fixed minimize/maximize button UX:
  - Button shows "▬" when expanded, "□" when minimized
  - Tooltip updates appropriately
- [x] Fixed extension reopen issue:
  - Added "Open Chat Assistant" button in popup
  - Works without page reload
  - Only shows on YouTube video pages with API key
- [x] Fixed manifest icon error (1:15 AM):
  - Removed reference to non-existent icon32.png
  - Extension now loads without errors
- [x] Enhanced fullscreen detection (1:15 AM):
  - Added multiple detection methods for YouTube fullscreen
  - Chat now properly restores after exiting fullscreen
  - Added debugging logs for troubleshooting
- [x] Fixed background tab transcript loading (1:20 AM):
  - Improved page ready detection for background tabs
  - Added progress updates for better user feedback
- [x] API Usage Tracking implemented (1:30 AM):
  - Created UsageTracker class for token counting and cost calculation
  - Integrated with Gemini API handler to track all requests
  - Added comprehensive UI in popup for usage statistics
  - Features: daily/total stats, token breakdown, CSV export, reset functionality

## Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/mv3/)
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [YouTube API Reference](https://developers.google.com/youtube/v3)

## Important Reminders

1. **Always use** `models/gemini-2.5-flash-preview-05-20`
2. **Test with long videos** to verify 1M context works
3. **Keep UI minimal** in MVP - features can be added later
4. **Focus on speed** - Users expect instant responses
5. **Privacy first** - No analytics or tracking in MVP

## Next Steps After Each Phase

### After Phase 1 (Foundation):
- Test core functionality thoroughly
- Get user feedback on UI placement
- Optimize API response time

### After Phase 2 (Core Features):
- Test on various websites with embeds
- Verify storage limits aren't hit
- Add keyboard shortcuts

### After Phase 3 (Memory):
- Implement export features
- Add conversation search
- Test with power users

## Questions to Consider

1. How to handle videos without transcripts?
2. Should we support live streams?
3. How to handle multiple videos on same page?
4. What about YouTube Shorts?
5. Rate limiting strategy for API calls?

## Current Status & Next Steps

**Latest Status**: Extension submitted to Chrome Web Store (June 8, 2025)
**Current Phase**: Pre-launch Reddit karma building
**See**: [`/docs/CURRENT_STATUS.md`](../docs/CURRENT_STATUS.md) for detailed progress tracking

### Immediate Priorities:
1. Build Reddit karma (100+ target)
2. Create demo video while waiting for approval
3. Set up landing page
4. Monitor Chrome Web Store for approval

## Important Design Decisions

### Embedded Videos
The extension **intentionally** only works on youtube.com domains for security reasons:
- Prevents running on all websites (major security risk)
- Maintains user privacy
- Easier Chrome Web Store approval
- Clear user expectations

See [`/docs/EMBEDDED_VIDEO_ANALYSIS.md`](../docs/EMBEDDED_VIDEO_ANALYSIS.md) for detailed analysis.

---

**Remember**: This extension's key differentiator is the 1M token context window. Always emphasize and test this capability.
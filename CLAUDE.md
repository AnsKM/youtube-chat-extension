# YouTube Chat Extension - AI Assistant Guide

This file contains important context and instructions for Claude (AI assistant) when working with the YouTube Chat Extension project.

## Project Overview

A Chrome extension that adds an AI-powered chat interface to YouTube videos, allowing users to ask questions about video content and get instant AI-generated responses. The extension uses smart routing to optimize API costs while maintaining response quality.

## Key Features

- **Interactive Chat UI** - Floating chat widget on YouTube video pages
- **Transcript Integration** - Automatically fetches video transcripts for context
- **Smart Query Routing** - Intelligently routes queries between GPT-3.5 and GPT-4 based on complexity
- **Cost Optimization** - Reduces API costs by up to 80% through smart routing
- **Caching System** - Caches responses to avoid redundant API calls
- **Usage Tracking** - Monitors API usage and costs

## Project Structure

```
/projects/youtube_chat_extension/
├── manifest.json           # Chrome extension manifest
├── src/
│   ├── background/        # Service worker and API handling
│   ├── content/          # Content scripts and UI
│   ├── popup/            # Extension popup interface
│   ├── smart-router/     # Intelligent query routing system
│   └── utils/            # Utility functions
├── landing-page/         # Marketing landing page
├── docs/                 # Comprehensive documentation
└── tests/               # Test suite
```

## Development Guidelines

### Chrome Extension Specifics

1. **Manifest V3** - Uses the latest Chrome extension manifest format
2. **Service Worker** - Background script runs as a service worker
3. **Content Script** - Injects UI into YouTube pages
4. **Message Passing** - Uses Chrome messaging API for communication

### Smart Router Implementation

The extension uses an intelligent routing system to optimize costs:

```javascript
// Query complexity classification
- Simple queries → GPT-3.5 Turbo (cheap, fast)
- Complex queries → GPT-4 (expensive, accurate)
- Cached queries → No API call
```

### Testing the Extension

1. **Local Development**:
   ```bash
   # Load unpacked extension in Chrome
   1. Open chrome://extensions/
   2. Enable Developer mode
   3. Click "Load unpacked"
   4. Select the extension directory
   ```

2. **Testing Features**:
   - Navigate to any YouTube video
   - Click the chat bubble icon
   - Ask questions about the video
   - Monitor console for debug info

### API Integration

The extension requires a Gemini API key:

```javascript
// Set in popup settings or background script
const API_KEY = 'your-gemini-api-key';
```

## Common Tasks

### Adding New Features

1. **UI Changes** - Modify `src/content/chat-ui.js`
2. **API Logic** - Update `src/background/api-handler.js`
3. **Smart Routing** - Enhance `src/smart-router/smart-query-router.js`
4. **Styling** - Edit `src/content/styles.css`

### Debugging

1. **Background Script**:
   ```javascript
   // View logs in service worker console
   chrome://extensions/ → Extension → "Inspect views: service worker"
   ```

2. **Content Script**:
   ```javascript
   // View logs in YouTube page console
   console.log('[YouTube Chat]', message);
   ```

3. **Message Passing**:
   ```javascript
   // Debug Chrome runtime messages
   chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
     console.log('Message received:', request);
   });
   ```

### Performance Optimization

1. **Minimize Bundle Size** - Keep extension lightweight
2. **Lazy Load Components** - Load chat UI only when needed
3. **Efficient Caching** - Cache responses with TTL
4. **Debounce API Calls** - Prevent rapid-fire requests

## Smart Router Details

### Query Classification

The router classifies queries into categories:

```javascript
const queryTypes = {
  SIMPLE: 'simple',      // Basic facts, timestamps
  MODERATE: 'moderate',  // Explanations, summaries
  COMPLEX: 'complex',    // Analysis, comparisons
  CREATIVE: 'creative'   // Generation, ideation
};
```

### Cost Tracking

Monitor API costs in real-time:

```javascript
// Cost tracking example
const costs = {
  'gpt-3.5-turbo': 0.002,  // per 1K tokens
  'gpt-4': 0.03            // per 1K tokens
};
```

## Deployment

### Chrome Web Store Submission

1. **Package Extension**:
   ```bash
   # Create ZIP file excluding unnecessary files
   zip -r youtube-chat-extension.zip . -x "*.git*" "node_modules/*" "tests/*"
   ```

2. **Store Listing Requirements**:
   - 5 screenshots (1280x800 or 640x400)
   - Promotional images
   - Privacy policy
   - Detailed description

### Landing Page

The marketing landing page is in `/landing-page/`:
- Static HTML/CSS/JS
- Can be hosted on GitHub Pages
- Includes demo GIF and feature highlights

## Known Issues & Solutions

1. **Transcript Fetching Fails**:
   - Some videos don't have transcripts
   - Handle gracefully with error message

2. **API Rate Limits**:
   - Implement exponential backoff
   - Queue requests when rate limited

3. **Extension Context Invalidated**:
   - Common when reloading extension
   - Implement reconnection logic

## Marketing & Growth

### Target Audience
- Students learning from YouTube
- Researchers analyzing content
- Content creators studying competitors
- Anyone wanting quick video insights

### Key Differentiators
- Works directly in YouTube (no separate app)
- Smart cost optimization
- Clean, minimal UI
- Fast response times

## Code Style Guidelines

1. **Use Modern JavaScript** - ES6+ features
2. **Async/Await** - For all asynchronous operations
3. **Error Boundaries** - Wrap API calls in try-catch
4. **Meaningful Names** - Clear variable and function names
5. **Comment Complex Logic** - Explain non-obvious code

## Security Considerations

1. **API Key Storage** - Never hardcode keys
2. **Content Security Policy** - Properly configured in manifest
3. **Input Sanitization** - Clean user inputs
4. **HTTPS Only** - All API calls over HTTPS

## Future Enhancements

1. **Multi-language Support** - Translate UI and responses
2. **Video Bookmarks** - Save important timestamps
3. **Export Features** - Download chat history
4. **Premium Features** - Subscription model
5. **Mobile Support** - Adapt for YouTube mobile app

## Testing Checklist

Before any release:
- [ ] Test on multiple YouTube video types
- [ ] Verify API key handling
- [ ] Check error states
- [ ] Test with/without transcripts
- [ ] Verify cost tracking accuracy
- [ ] Test extension reload scenarios
- [ ] Check memory usage over time

## Support & Documentation

- User guide: `/docs/guides/`
- API docs: `/docs/smart-router/`
- Troubleshooting: `/docs/setup/TROUBLESHOOTING.md`
- Architecture: `/docs/ARCHITECTURE.md`
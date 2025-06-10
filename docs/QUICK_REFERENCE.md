# YouTube Chat Extension - Quick Reference

## Essential Information

### Model Configuration
```javascript
// ALWAYS use this exact model name
const MODEL_NAME = 'gemini-2.5-flash-preview-05-20';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta';
```

### Key Files
- **Main Logic**: `/content/content-script-simple.js`
- **Transcript Fetching**: `/content/transcript-fetcher.js`
- **API Handler**: `/background/service-worker.js`
- **Styles**: `/content/styles.css`

### Console Commands for Testing
```javascript
// Check extension status
window.ytChatExtension

// View conversation
window.ytChatExtension.conversationHistory

// Test history panel
window.ytChatExtension.toggleHistory()

// Force save
window.ytChatExtension.saveConversation()

// Check transcript
window.ytChatExtension.transcript
```

### Common Tasks

#### Adding a New Button
1. Add HTML in `createChatUI()` method
2. Add event listener with null check
3. Add CSS styles with hover state

#### Modifying AI Responses
Look for `enhancedPrompt` in `sendMessage()` method:
```javascript
// Line ~309 in content-script-simple.js
enhancedPrompt = `You are a helpful AI assistant...`
```

#### Changing Response Length
```javascript
// Line ~227 in service-worker.js
maxOutputTokens: 3500  // Currently set to 3500 tokens
```

#### Exporting Conversations
The export feature allows users to download their chat in 3 formats:
```javascript
// Available export formats
- Markdown (.md) - Best for documentation
- JSON (.json) - For developers & data analysis  
- Plain Text (.txt) - Simple, readable format

// To trigger export programmatically
window.ytChatExtension.exportChat()
```

#### Debugging Storage
```javascript
// View all stored data
chrome.storage.local.get(null, (data) => console.log(data));

// Clear all data
chrome.storage.local.clear();
```

### CSS Classes Reference
- `.youtube-chat-extension` - Main container
- `.chat-history-panel` - History sidebar
- `.chat-message.user` - User messages
- `.chat-message.assistant` - AI messages
- `.visible` - Show element
- `.minimized` - Minimize chat

### Storage Keys
- `gemini_api_key` - User's API key
- `chat_{videoId}` - Conversation for each video

### Event Flow
1. Page loads → `YouTubeChatExtension` initializes
2. Video detected → `loadVideoChat()` called
3. Transcript fetched → `TranscriptFetcher.fetchTranscript()`
4. User sends message → `sendMessage()`
5. API call → Background script → Gemini API
6. Response displayed → `addMessage()`
7. Conversation saved → `saveConversation()`

### Testing URLs
- Short video: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Long video: Any 1+ hour tutorial
- No transcript: Music videos often lack transcripts

### Common Issues & Fixes

#### Extension won't load
- Check manifest.json syntax
- Ensure all icon files exist
- Look for errors in chrome://extensions/

#### Chat doesn't appear
- Check if API key is set
- Verify you're on a video page
- Check console for errors

#### History panel issues
- Should be hidden by default
- Uses `left: -320px !important` and `visibility: hidden`
- Toggle with 📚 button

#### Responses cut off
- Increase `maxOutputTokens` in service-worker.js
- Check markdown parsing in `addMessage()`

### Performance Tips
- Debounce user input (already implemented)
- Cache transcripts in chrome.storage
- Limit conversation history to last 10 messages
- Use CSS transforms for animations

### Security Notes
- API key stored in chrome.storage.local
- No external analytics or tracking
- All data stays local to user's browser
- Content Security Policy in manifest.json

### Future Feature Hooks
- Timestamp support: Look for `timestamp` comments
- Export: Add to chat controls area
- Keyboard shortcuts: Add to manifest.json
- Theme support: CSS variables ready

### Release Checklist
1. Update version in manifest.json
2. Test on 3+ different videos
3. Check dark mode
4. Verify history saves/loads
5. Test with/without transcripts
6. Update README.md
7. Create release notes

### Useful Regex Patterns
```javascript
// YouTube video ID
/(?:v=|\/embed\/|youtu\.be\/)([0-9A-Za-z_-]{11})/

// Timestamp in transcript
/(\d{1,2}):(\d{2})/

// Markdown bold
/\*\*([^*]+)\*\*/g
```

---

**Remember**: Always use `models/gemini-2.5-flash-preview-05-20` for the 1M context window!
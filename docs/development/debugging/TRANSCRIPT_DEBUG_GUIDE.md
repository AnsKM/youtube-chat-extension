# YouTube Chat Extension - Transcript Debugging Guide

## Quick Debug Steps

### 1. Run the Debug Script
Copy and paste this into your browser console on a YouTube video page:

```javascript
// Quick check - run this first
console.log('Video ID:', new URLSearchParams(window.location.search).get('v'));
console.log('Transcript buttons:', Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('transcript')).length);
console.log('Player exists:', !!document.querySelector('#movie_player'));
```

### 2. Check Console Logs
After reloading the extension and visiting a YouTube video, look for these messages:

**Good Signs:**
- `Fetching transcript for video: [VIDEO_ID]`
- `Found caption tracks: [number]`
- `Successfully extracted [number] transcript segments`

**Problem Signs:**
- `No transcript segments found in DOM`
- `No caption tracks found`
- `Failed to fetch transcript: 403` (CORS issue)

### 3. Manual Transcript Check
1. Open any YouTube video with captions
2. Click the "..." menu below the video
3. Click "Show transcript"
4. If transcript appears, the extension should be able to fetch it

### 4. Test the Enhanced Version
The extension now tries 4 different methods:

1. **DOM Method** (NEW) - Opens transcript panel and reads directly
2. **Player API Method** - Uses YouTube's player object
3. **Page Data Method** - Extracts from ytInitialPlayerResponse
4. **TimedText API** - Fetches from caption URLs

### 5. Common Issues & Solutions

#### Issue: "No transcript available"
**Solutions:**
- Video may not have captions enabled
- Try a different video (test with popular videos that definitely have captions)
- Check if you can manually open the transcript panel

#### Issue: CORS errors in console
**Solutions:**
- Reload the extension in chrome://extensions
- Make sure you're on youtube.com (not a different domain)
- Check that manifest.json includes `*.googlevideo.com` in host_permissions

#### Issue: Transcript loads but shows empty
**Solutions:**
- DOM structure may have changed
- Run the debug script to find working selectors
- Check console for parsing errors

### 6. Provide Feedback
If transcripts still don't work, please share:

1. The console output when you run:
```javascript
// Copy this entire debug output
(async () => {
  const debug = {
    url: window.location.href,
    videoId: new URLSearchParams(window.location.search).get('v'),
    hasPlayer: !!document.querySelector('#movie_player'),
    transcriptButtons: Array.from(document.querySelectorAll('button'))
      .filter(b => b.textContent.toLowerCase().includes('transcript'))
      .map(b => b.textContent),
    segments: document.querySelectorAll('ytd-transcript-segment-renderer').length,
    errors: []
  };
  
  // Try to get player response
  try {
    const player = document.querySelector('#movie_player');
    if (player && player.getPlayerResponse) {
      const response = player.getPlayerResponse();
      debug.hasPlayerResponse = !!response;
      debug.hasCaptions = !!(response?.captions?.playerCaptionsTracklistRenderer);
    }
  } catch (e) {
    debug.errors.push(e.message);
  }
  
  console.log('DEBUG DATA:', JSON.stringify(debug, null, 2));
})();
```

2. A screenshot of the Network tab filtered by "timedtext"
3. Whether you can see the transcript panel manually

### 7. Test Videos
Try these videos that should have transcripts:
- Tech tutorial: https://www.youtube.com/watch?v=dQw4w9WgXcQ
- TED talk: Any recent TED talk
- Google/YouTube official channels

### 8. Success Indicators
When working correctly, you should see:
- Chat UI shows: "✅ Transcript loaded (X segments)"
- Console shows successful fetch messages
- AI responses reference specific video content

## Advanced Debugging

### Check Extension Permissions
```javascript
// Run in extension's background page console
chrome.permissions.getAll((permissions) => {
  console.log('Permissions:', permissions);
});
```

### Monitor Transcript Fetching
```javascript
// Add this to see all fetch attempts
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0].includes('timedtext') || args[0].includes('caption')) {
    console.log('Transcript fetch:', args[0]);
  }
  return originalFetch.apply(this, args);
};
```

### Force Retry
If transcript fails to load, you can force a retry:
```javascript
// In console, after extension loads
window.ytChatExtension?.transcriptFetcher?.fetchTranscript('[VIDEO_ID]');
```
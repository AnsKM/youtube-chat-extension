# Background Tab Loading Fix V2

## The Problem
When opening YouTube videos in new background tabs, the transcript would fail to load even though it was actually available. The console showed the transcript was found (1656 segments) but the UI showed an error.

## Root Cause Analysis
From your console logs:
```
content-script-simple.js:177 New video detected: DNfp1XKC15k
transcript-fetcher.js:76 Found "Show transcript" button, clicking...
transcript-fetcher.js:99 Found 1656 segments with selector: ytd-transcript-segment-renderer
transcript-fetcher.js:150 Successfully extracted 1656 transcript segments from DOM
content-script-simple.js:256 Transcript loaded successfully: 1656 segments
```

The transcript WAS loading, but the UI had already shown the error message because:
1. The extension was too impatient
2. The transcript button takes time to appear and load
3. Background tabs load differently than foreground tabs

## Fixes Applied

### 1. Improved Page Ready Detection
```javascript
// Now waits for:
- Video player
- Video element with data
- Primary content area
- Video title
- Transcript button availability
```

### 2. Better Loading Feedback
- Shows "Checking transcript availability..." 
- Updates with attempt numbers
- Only shows error after all retries fail

### 3. Extended Wait Times
- Initial page detection: +500ms delay
- Transcript button wait: 3 seconds
- Segment appearance wait: Up to 5 seconds
- More patient with background tabs

### 4. Progressive Loading
```javascript
// Step 1: Wait for page visibility
// Step 2: Wait for YouTube UI elements
// Step 3: Wait for transcript button
// Step 4: Click and wait for segments
// Step 5: Extract transcript
```

## What You'll See Now

### Before:
1. Open tab in background → "Couldn't load transcript" → Have to reload

### After:
1. Open tab in background → "Checking transcript availability..."
2. Switch to tab → Waits properly → "Transcript loaded (1656 segments)"

## Testing

1. Go to YouTube search
2. Right-click video → Open in new tab
3. DON'T switch to it immediately
4. Wait 5-10 seconds
5. Switch to tab
6. Should see transcript load successfully

## Key Improvements

- **500ms delay** after video detection (gives YouTube time to start)
- **30 attempts** to check page ready (15 seconds total)
- **3 second wait** after clicking transcript button
- **10 attempts** to wait for segments to appear
- **Progress updates** so you know it's working

## Debug Messages

You'll now see in console:
- "Waiting for YouTube page to be ready..."
- "YouTube page is ready"
- "Transcript button not found yet, waiting more..."
- "Transcript segments are now visible"

## If It Still Fails

The retry button is still there as a backup, but you shouldn't need it anymore. The extension is now much more patient and will wait for YouTube to fully load before giving up.

---

The key insight from your logs was that the transcript WAS loading successfully, just after the UI had already shown an error. This fix makes the extension wait properly for all the YouTube elements to load before making decisions.
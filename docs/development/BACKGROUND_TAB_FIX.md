# Background Tab Loading Fix

## Issue Description
When opening YouTube videos in new tabs from search results, the extension would fail to load transcripts if the tab finished loading in the background (without focus).

### Why This Happens
1. YouTube doesn't fully render content in background tabs
2. Transcript elements aren't available until tab gains focus
3. The extension was trying to fetch transcripts too early

## The Fix

### 1. Page Visibility Detection
Added `waitForPageReady()` method that:
- Detects if page is hidden (background tab)
- Waits for tab to become visible before proceeding
- Has a 10-second timeout to prevent infinite waiting

### 2. YouTube Player Ready Check
- Waits for video element to be ready (readyState >= 2)
- Checks for player UI elements
- Maximum 20 attempts with 500ms intervals

### 3. Retry Mechanism
- Attempts transcript fetch up to 3 times
- 2-second delay between attempts
- Gives YouTube more time to load content

### 4. User Retry Button
- Shows "Retry Loading Transcript" button on failure
- Allows manual retry with longer wait time
- Better user experience

## How It Works

```javascript
// Wait for page visibility
if (document.hidden) {
  await new Promise(resolve => {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) resolve();
    });
  });
}

// Wait for player ready
while (videoElement.readyState < 2) {
  await new Promise(resolve => setTimeout(resolve, 500));
}

// Retry transcript fetch
for (let i = 0; i < 3; i++) {
  try {
    transcript = await fetchTranscript();
    if (transcript) break;
  } catch {
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
```

## User Experience

### Before Fix:
- Open video in new tab → Switch to tab → "Couldn't load transcript" error

### After Fix:
- Open video in new tab → Switch to tab → Waits for page ready → Loads transcript
- If still fails → Shows retry button → User can manually retry

## Testing

1. Go to YouTube search
2. Right-click video → "Open in new tab"
3. Wait for tab to load completely
4. Switch to the tab
5. Extension should now load transcript successfully

If transcript still fails:
- Click "Retry Loading Transcript" button
- Should succeed on second attempt

## Console Messages

Look for these new messages:
- "Page is hidden, waiting for visibility..."
- "YouTube player is ready"
- "Retrying transcript fetch in 2 seconds..."
- "Transcript loaded on retry: X segments"
# Testing Timestamp Support

## How to Test the New Timestamp Feature

### 1. Reload the Extension
- Go to `chrome://extensions/`
- Click the refresh icon on the YouTube Chat Extension

### 2. Navigate to a YouTube Video
- Any video with captions/transcripts will work
- Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ

### 3. Wait for Transcript to Load
- You should see "✅ Transcript loaded (XXX segments)"

### 4. Test Questions to Try

Ask these questions to see timestamps in action:

1. **"When does the video talk about [topic]?"**
   - The AI should respond with specific timestamps

2. **"What happens at the beginning of the video?"**
   - Should reference early timestamps

3. **"Can you give me a timeline of the main topics?"**
   - Should provide multiple timestamps

4. **"What's discussed around the 2 minute mark?"**
   - Tests understanding of specific time references

### 5. Click on Timestamps
- Any timestamp in format [MM:SS] or [HH:MM:SS] should be clickable
- Clicking jumps the video to that time
- You'll see a blue notification: "Jumped to MM:SS"

### 6. Visual Indicators
- Timestamps appear in blue with hover effects
- Clicking shows a fade-in/out notification
- Video should jump to the exact time

## Expected Behavior

1. **Timestamp Detection**:
   - [2:35] - clickable
   - [1:23:45] - clickable
   - "at 2:35" - converted to [2:35]
   - (2:35) - converted to [2:35]

2. **Video Control**:
   - Video seeks to clicked timestamp
   - If paused, video starts playing
   - Shows visual feedback

3. **AI Responses**:
   - Includes relevant timestamps when discussing video content
   - Preserves timestamp format from transcript
   - Makes temporal references clickable

## Troubleshooting

**Timestamps not clickable?**
- Check console for errors
- Ensure transcript loaded successfully
- Verify timestamp format is correct

**Video doesn't jump?**
- Check if video player is detected
- Look for console errors
- Try refreshing the page

**No timestamps in AI responses?**
- Ask specifically about "when" something happens
- Request a timeline or overview
- Check if transcript includes timestamps

## Console Commands for Debugging

```javascript
// Check if transcript has timestamps
window.ytChatExtension.transcript.fullTextWithTimestamps

// Test timestamp processing
window.ytChatExtension.processTimestamps("Check this out at 2:35 and also at 10:42")

// Manually seek to time
window.ytChatExtension.seekToTimestamp(155) // 2:35 in seconds

// Format timestamp
window.ytChatExtension.formatTimestamp(155) // Returns "2:35"
```

## Sample Conversation

**You**: "Can you give me a summary with timestamps of the key points?"

**AI**: "Here's a timeline of the main topics discussed:

The video starts with an introduction **[0:15]** where the speaker outlines the agenda. At **[2:30]**, they dive into the first main concept about...

The discussion gets particularly interesting around **[5:45]** when they explain...

A key insight is shared at **[8:20]** about...

The conclusion begins at **[12:10]** with practical takeaways..."

(Each timestamp would be clickable!)
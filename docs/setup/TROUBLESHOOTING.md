# YouTube Chat Extension - Troubleshooting Guide

## Quick Fixes

### Extension Won't Load
✅ **Fixed**: Use `youtube-chat-extension-v2-fixed.zip`
- Removed non-existent icon32.png reference
- Removed unused web_accessible_resources

### Chat Doesn't Reappear After Fullscreen
✅ **Fixed**: Enhanced fullscreen detection
- Now monitors multiple fullscreen indicators
- Added debug logging (check console)
- Should work with F key, button click, and all fullscreen methods

To verify it's working:
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Enter/exit fullscreen
4. Look for messages like:
   - "YouTube fullscreen state changed: true/false"
   - "Restoring from fullscreen. Was visible before: true"

### Extension Doesn't Work on Embedded Videos
⚠️ **This is intentional** - For security, the extension only works on youtube.com

**Why?**
- Security: Prevents access to all websites
- Privacy: Users expect YouTube-only access
- Performance: Only loads where needed

**Workaround:**
Click the YouTube logo on the embedded video to go to YouTube.com

### Chat Won't Open After Closing
✅ **Fixed**: Added "Open Chat Assistant" button in popup
- Click extension icon
- Click "Open Chat Assistant"
- No reload needed

### Minimize Button Doesn't Change
✅ **Fixed**: Button now shows:
- "▬" when expanded (tooltip: "Minimize")
- "□" when minimized (tooltip: "Maximize")

## Debug Mode

Add these to console to see what's happening:
```javascript
// Check if extension loaded
console.log(window.ytChatExtension);

// Check fullscreen state
console.log(document.fullscreenElement);
console.log(document.querySelector('.ytp-fullscreen'));

// Manually trigger chat
window.ytChatExtension.showChat();
```

## Common Issues

### "API Key Not Set"
1. Click extension icon
2. Enter your Gemini API key
3. Click Save
4. Reload page

### Chat Appears Behind Video
- This is a z-index issue
- Try minimizing and maximizing
- Report if consistent

### Transcript Not Loading
- Some videos don't have captions
- Try a different video
- Check if video has CC button

## Still Having Issues?

1. **Collect Info:**
   - Chrome version
   - Extension version (1.1.0)
   - Console errors (F12 → Console)
   - Steps to reproduce

2. **Try:**
   - Incognito mode
   - Disable other extensions
   - Clear cache and reload

3. **Report:**
   - Include console logs
   - Screenshots help
   - Specific video URL

## Version History

- **1.1.0**: Initial release with bug fixes
- **1.0.1**: Fixed fullscreen, minimize button, extension reopen
- **1.0.0**: Original submission
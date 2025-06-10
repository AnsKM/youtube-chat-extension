# YouTube Chat Extension - Bug Fix Testing Guide

## Version: 1.0.1 (Bug Fix Release)
**Date**: June 8, 2025

## Fixed Issues

### 1. ✅ Fullscreen Auto-Hide
- Chat now automatically hides when entering fullscreen
- Restores previous state when exiting fullscreen
- Works with:
  - F key fullscreen
  - Fullscreen button click
  - Theater mode (T key)

### 2. ✅ Minimize/Maximize Button
- Button now shows "▬" when expanded
- Changes to "□" when minimized
- Tooltip updates accordingly

### 3. ✅ Extension Reopen
- Popup now shows "Open Chat Assistant" button
- Works without page reload
- Only shows on YouTube video pages with API key

## Testing Instructions

### Test 1: Fullscreen Behavior
1. Open a YouTube video
2. Click extension to open chat
3. Press F to enter fullscreen
   - ✓ Chat should disappear
4. Press F again to exit fullscreen
   - ✓ Chat should reappear
5. Minimize chat, then enter fullscreen
   - ✓ Chat should restore minimized after exiting fullscreen

### Test 2: YouTube Theater Mode
1. Open chat on YouTube video
2. Press T for theater mode
   - ✓ Chat should remain visible (not fullscreen)
3. Click fullscreen button in player
   - ✓ Chat should hide

### Test 3: Minimize/Maximize Button
1. Open chat assistant
2. Look at minimize button
   - ✓ Should show "▬" icon
   - ✓ Tooltip should say "Minimize"
3. Click minimize button
   - ✓ Chat should collapse to header only
   - ✓ Button should change to "□"
   - ✓ Tooltip should say "Maximize"
4. Click again to maximize
   - ✓ Should restore to full size

### Test 4: Extension Popup Behavior
1. Close chat with X button
2. Click extension icon
   - ✓ Should see "Open Chat Assistant" button
3. Click "Open Chat Assistant"
   - ✓ Chat should open without reload
   - ✓ Popup should close

### Test 5: Different Scenarios
1. **No API Key**: 
   - Popup should show API key input
   - No "Open Chat" button
2. **Not on YouTube**: 
   - No "Open Chat" button
   - Normal settings shown
3. **YouTube Homepage**: 
   - No "Open Chat" button (no video)
4. **YouTube Video**: 
   - "Open Chat" button visible

## Edge Cases

### Fullscreen Edge Cases
- [ ] Multiple monitors
- [ ] Picture-in-picture mode
- [ ] Embedded YouTube videos
- [ ] Mobile viewport

### State Persistence
- [ ] Chat position maintained
- [ ] Minimized state remembered
- [ ] Conversation preserved

## Known Limitations

1. **Embedded Videos**: Fullscreen detection may vary
2. **Mobile**: Extension designed for desktop
3. **Theater Mode**: Intentionally not treated as fullscreen

## Regression Tests

Ensure these still work:
- [ ] Timestamp clicking
- [ ] Chat history
- [ ] Export functionality
- [ ] API key saving
- [ ] Conversation persistence
- [ ] Copy button
- [ ] New chat button

## Performance

Check for:
- No lag when entering/exiting fullscreen
- Smooth minimize/maximize animations
- Quick popup response

## Browser Compatibility

Test on:
- [ ] Chrome (primary)
- [ ] Edge
- [ ] Brave
- [ ] Opera

## If Issues Found

1. Check console for errors
2. Note exact steps to reproduce
3. Check if issue is consistent
4. Test in incognito mode

## Success Metrics

- All fullscreen transitions smooth
- Button states update correctly
- No page reload required
- User experience improved

---

**Testing Complete**: ☐ 
**Approved By**: ________________
**Date**: ________________
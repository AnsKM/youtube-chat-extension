# YouTube Chat Extension - Embedded Video Support Analysis

## Current Behavior
The extension only works on youtube.com and www.youtube.com domains. It does NOT work on embedded YouTube videos on other websites.

## Why This Happens
The manifest.json specifies content scripts to only run on YouTube domains:
```json
"content_scripts": [
  {
    "matches": [
      "https://www.youtube.com/*",
      "https://youtube.com/*"
    ],
    ...
  }
]
```

## Security & Privacy Considerations

### Option 1: Keep Current Behavior (RECOMMENDED)
**Pros:**
- Maximum security - extension only accesses YouTube.com
- Clear user expectations - "YouTube Chat Assistant" works on YouTube
- No privacy concerns about tracking across websites
- Smaller attack surface
- Easier Chrome Web Store approval

**Cons:**
- Doesn't work on embedded videos
- Users might expect it to work everywhere

### Option 2: Support All Embedded Videos
**Pros:**
- Works on any website with YouTube embeds
- More convenient for users

**Cons:**
- MAJOR SECURITY RISK: Extension runs on ALL websites
- Privacy concern: Could theoretically track browsing
- Chrome Web Store might reject or require extra justification
- Users might be concerned about permissions
- More complex to maintain

### Option 3: User-Activated on Embeds (BEST COMPROMISE)
**Implementation:**
1. Add optional permission for `<all_urls>`
2. When user clicks extension on a non-YouTube site:
   - Check if page has YouTube embed
   - Ask user: "Enable chat for YouTube videos on this site?"
   - Temporarily inject content script

**Pros:**
- User control over where it runs
- Works on embeds when needed
- Maintains security by default

**Cons:**
- More complex implementation
- Requires user action

## Recommendation

For initial release, stick with **Option 1** (YouTube-only). This is:
- Most secure
- Easiest to get approved
- Sets clear expectations
- Can always add embed support in v2.0 based on user feedback

## If Users Request Embed Support

Tell them:
"For security reasons, the extension currently only works on YouTube.com. This ensures your browsing privacy and keeps the extension lightweight. We're considering adding opt-in support for embedded videos in a future update based on user demand."

## Technical Note

To detect embedded videos without running on all sites, we'd need:
1. User clicks extension icon
2. Extension checks current tab for YouTube iframes
3. Asks permission to inject on that specific domain
4. Uses chrome.tabs.executeScript() for one-time injection

This maintains security while providing flexibility.
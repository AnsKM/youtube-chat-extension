# YouTube Chat Extension - Bug Fix Plan

## Bug Report Summary (June 8, 2025)

### 1. Fullscreen Video Bug 🎥
**Issue**: Chat assistant remains visible when YouTube video enters fullscreen mode, causing distraction.
**Expected**: Chat should automatically hide when entering fullscreen and restore when exiting.

### 2. Minimize/Maximize Button UX 🔄
**Issue**: Minimize button doesn't change to maximize icon when chat is minimized.
**Expected**: Button should show "_" when expanded and "□" when minimized, with appropriate tooltips.

### 3. Extension Reopen After Close ❌
**Issue**: After closing chat with X button, clicking extension icon doesn't reopen chat. Requires page reload.
**Expected**: Extension popup should show "Open Chat" button when API key is configured, allowing chat restart.

## Implementation Plan

### 1. Fullscreen Detection & Auto-Hide

#### A. Add Fullscreen Event Listeners
```javascript
// In content-script-simple.js init()
document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());

// YouTube specific fullscreen (theater mode)
const observer = new MutationObserver(() => {
  const ytdApp = document.querySelector('ytd-app');
  if (ytdApp && ytdApp.hasAttribute('fullscreen')) {
    this.handleYouTubeFullscreen(true);
  } else {
    this.handleYouTubeFullscreen(false);
  }
});
```

#### B. Implementation Methods
```javascript
handleFullscreenChange() {
  const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
  if (isFullscreen) {
    this.hideForFullscreen();
  } else {
    this.restoreFromFullscreen();
  }
}

hideForFullscreen() {
  this.wasVisibleBeforeFullscreen = this.chatUI.classList.contains('visible');
  this.wasMinimizedBeforeFullscreen = this.chatUI.classList.contains('minimized');
  this.hideChat();
}

restoreFromFullscreen() {
  if (this.wasVisibleBeforeFullscreen) {
    this.showChat();
    if (this.wasMinimizedBeforeFullscreen) {
      this.chatUI.classList.add('minimized');
    }
  }
}
```

### 2. Minimize/Maximize Button Enhancement

#### A. Update HTML Structure
```javascript
// Dynamic button based on state
const minimizeBtn = container.querySelector('.minimize');
minimizeBtn.innerHTML = this.chatUI.classList.contains('minimized') ? '□' : '_';
minimizeBtn.title = this.chatUI.classList.contains('minimized') ? 'Maximize' : 'Minimize';
```

#### B. Update Toggle Function
```javascript
toggleMinimize() {
  this.chatUI.classList.toggle('minimized');
  const minimizeBtn = this.chatUI.querySelector('.minimize');
  const isMinimized = this.chatUI.classList.contains('minimized');
  
  // Update button appearance
  minimizeBtn.innerHTML = isMinimized ? '□' : '_';
  minimizeBtn.title = isMinimized ? 'Maximize' : 'Minimize';
  
  // Save state
  this.saveUIState();
}
```

### 3. Extension Popup Enhancement

#### A. Update popup.html
Add a new section after API configuration:
```html
<!-- Chat Control Section (shown when API key exists) -->
<section id="chatControlSection" class="settings-section" style="display: none;">
  <h2>Chat Assistant</h2>
  <button id="openChat" class="btn btn-primary">Open Chat Assistant</button>
  <p class="help-text">Click to start chatting with the current YouTube video</p>
</section>
```

#### B. Update popup.js
```javascript
// Check if on YouTube and show appropriate UI
async function updateUIBasedOnContext() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isYouTube = tab.url.includes('youtube.com/watch');
  const hasApiKey = await checkApiKeyExists();
  
  if (hasApiKey && isYouTube) {
    document.getElementById('chatControlSection').style.display = 'block';
    document.getElementById('openChat').addEventListener('click', openChatAssistant);
  }
}

async function openChatAssistant() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'openChat' });
  window.close(); // Close popup after opening chat
}
```

#### C. Update content-script message listener
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleChat') {
    this.toggleChat();
  } else if (request.action === 'openChat') {
    this.showChat();
    // If chat was previously closed, reinitialize if needed
    if (!this.currentVideoId) {
      this.detectVideo();
    }
  }
});
```

### 4. State Persistence

#### A. Save UI State
```javascript
saveUIState() {
  const state = {
    isVisible: this.chatUI.classList.contains('visible'),
    isMinimized: this.chatUI.classList.contains('minimized'),
    videoId: this.currentVideoId
  };
  chrome.storage.local.set({ [`uiState_${window.location.href}`]: state });
}
```

#### B. Restore UI State
```javascript
async restoreUIState() {
  const result = await chrome.storage.local.get([`uiState_${window.location.href}`]);
  const state = result[`uiState_${window.location.href}`];
  
  if (state && state.videoId === this.currentVideoId) {
    if (state.isVisible) {
      this.showChat();
    }
    if (state.isMinimized) {
      this.chatUI.classList.add('minimized');
      this.updateMinimizeButton();
    }
  }
}
```

## Testing Checklist

- [ ] Test fullscreen detection on regular YouTube videos
- [ ] Test fullscreen detection on embedded videos
- [ ] Test theater mode detection
- [ ] Verify chat restores to previous state after exiting fullscreen
- [ ] Test minimize/maximize button icon changes
- [ ] Test minimize/maximize button tooltip changes
- [ ] Test extension popup "Open Chat" button
- [ ] Test chat reopens without page reload
- [ ] Test state persistence across page navigation
- [ ] Test on different browsers (Chrome, Edge, Brave)

## Priority Order

1. **HIGH**: Fullscreen auto-hide (most disruptive bug)
2. **HIGH**: Extension reopen functionality (affects usability)
3. **MEDIUM**: Minimize/maximize button UX (visual polish)

## Estimated Time

- Fullscreen detection: 30 minutes
- Extension popup enhancement: 45 minutes
- Minimize/maximize button: 15 minutes
- Testing & refinement: 30 minutes
- **Total**: ~2 hours
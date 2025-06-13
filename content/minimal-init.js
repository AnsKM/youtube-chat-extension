// Minimal initialization to verify basic functionality
console.log('%c[MINIMAL INIT] Starting minimal initialization', 'background: #2196F3; color: white; font-size: 14px; padding: 5px;');

class MinimalYouTubeChat {
  constructor() {
    console.log('[MINIMAL INIT] Constructor called');
    this.chatUI = null;
    this.chatBubble = null;
  }
  
  init() {
    console.log('[MINIMAL INIT] Initializing...');
    
    // Create bubble
    this.createBubble();
    
    // Create chat UI
    this.createChatUI();
    
    console.log('[MINIMAL INIT] Initialization complete');
  }
  
  createBubble() {
    console.log('[MINIMAL INIT] Creating bubble...');
    
    if (document.querySelector('.youtube-chat-bubble')) {
      console.log('[MINIMAL INIT] Bubble already exists');
      return;
    }
    
    const bubble = document.createElement('div');
    bubble.className = 'youtube-chat-bubble';
    bubble.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    bubble.title = 'Open YouTube Chat Assistant';
    
    bubble.addEventListener('click', () => {
      console.log('[MINIMAL INIT] Bubble clicked');
      this.toggleChat();
    });
    
    document.body.appendChild(bubble);
    this.chatBubble = bubble;
    
    console.log('[MINIMAL INIT] Bubble created:', bubble);
  }
  
  createChatUI() {
    console.log('[MINIMAL INIT] Creating chat UI...');
    
    if (document.querySelector('.youtube-chat-extension')) {
      console.log('[MINIMAL INIT] Chat UI already exists');
      return;
    }
    
    const container = document.createElement('div');
    container.className = 'youtube-chat-extension';
    container.style.display = 'none';
    
    container.innerHTML = `
      <div class="chat-header">
        <div class="header-left">
          <span class="chat-title">YouTube Chat (Minimal Test)</span>
        </div>
        <div class="header-controls">
          <button class="close">×</button>
        </div>
      </div>
      <div class="chat-messages">
        <div class="message assistant">
          <div class="content">This is a minimal test version. If you can see this, the extension is loading!</div>
        </div>
      </div>
      <div class="chat-input-container">
        <input type="text" class="chat-input" placeholder="Test input..." />
        <button class="chat-send">Send</button>
      </div>
    `;
    
    document.body.appendChild(container);
    this.chatUI = container;
    
    // Add close handler
    container.querySelector('.close')?.addEventListener('click', () => {
      this.hideChat();
    });
    
    console.log('[MINIMAL INIT] Chat UI created:', container);
  }
  
  toggleChat() {
    if (!this.chatUI) return;
    
    if (this.chatUI.style.display === 'none') {
      this.chatUI.style.display = 'flex';
      this.chatUI.classList.add('visible');
    } else {
      this.chatUI.classList.remove('visible');
      this.chatUI.style.display = 'none';
    }
  }
  
  hideChat() {
    if (this.chatUI) {
      this.chatUI.classList.remove('visible');
      this.chatUI.style.display = 'none';
    }
  }
}

// Initialize immediately
const minimalChat = new MinimalYouTubeChat();

// Try multiple initialization methods
if (document.body) {
  console.log('[MINIMAL INIT] Body exists, initializing now');
  minimalChat.init();
} else {
  console.log('[MINIMAL INIT] Waiting for body...');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[MINIMAL INIT] DOMContentLoaded fired');
      minimalChat.init();
    });
  } else {
    // Fallback with timeout
    setTimeout(() => {
      console.log('[MINIMAL INIT] Timeout initialization');
      minimalChat.init();
    }, 1000);
  }
}

console.log('[MINIMAL INIT] Script completed');
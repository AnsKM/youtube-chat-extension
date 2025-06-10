/**
 * Chat UI Component
 * Handles all UI interactions for the YouTube Chat Extension
 */

export class ChatUI {
  constructor() {
    this.container = null;
    this.messagesContainer = null;
    this.inputField = null;
    this.sendButton = null;
    this.isMinimized = false;
    this.isVisible = false;
    this.messages = [];
    
    // Callbacks
    this.onSendMessage = null;
    this.onClearChat = null;
    this.onExportChat = null;
    
    this.createUI();
  }

  createUI() {
    // Create main container
    this.container = document.createElement('div');
    this.container.className = 'youtube-chat-extension';
    this.container.innerHTML = `
      <div class="chat-header">
        <span class="chat-title">AI Chat Assistant</span>
        <div class="chat-controls">
          <button class="chat-btn minimize" title="Minimize">_</button>
          <button class="chat-btn clear" title="Clear chat">Clear</button>
          <button class="chat-btn export" title="Export chat">Export</button>
          <button class="chat-btn close" title="Close">×</button>
        </div>
      </div>
      <div class="chat-messages">
        <div class="welcome-message">
          <h3>Welcome to YouTube Chat Assistant!</h3>
          <p>I can help you understand and discuss this video. Ask me anything!</p>
          <div class="suggested-prompts">
            <button class="suggested-prompt">Summarize this video</button>
            <button class="suggested-prompt">What are the key points?</button>
            <button class="suggested-prompt">Explain the main concept</button>
          </div>
        </div>
      </div>
      <div class="chat-input-container">
        <input type="text" class="chat-input" placeholder="Ask about the video..." />
        <button class="chat-send">Send</button>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(this.container);
    
    // Get references
    this.messagesContainer = this.container.querySelector('.chat-messages');
    this.inputField = this.container.querySelector('.chat-input');
    this.sendButton = this.container.querySelector('.chat-send');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Make draggable
    this.makeDraggable();
  }

  setupEventListeners() {
    // Send button
    this.sendButton.addEventListener('click', () => this.sendMessage());
    
    // Enter key to send
    this.inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Control buttons
    this.container.querySelector('.minimize').addEventListener('click', () => this.toggleMinimize());
    this.container.querySelector('.clear').addEventListener('click', () => {
      if (this.onClearChat) this.onClearChat();
    });
    this.container.querySelector('.export').addEventListener('click', () => this.showExportMenu());
    this.container.querySelector('.close').addEventListener('click', () => this.hide());
    
    // Suggested prompts
    this.container.querySelectorAll('.suggested-prompt').forEach(btn => {
      btn.addEventListener('click', () => {
        this.inputField.value = btn.textContent;
        this.sendMessage();
      });
    });
  }

  makeDraggable() {
    const header = this.container.querySelector('.chat-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    const dragStart = (e) => {
      if (e.target.closest('.chat-controls')) return;
      
      if (e.type === 'touchstart') {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
      } else {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
      }

      if (e.target === header || e.target.closest('.chat-title')) {
        isDragging = true;
      }
    };

    const dragEnd = () => {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
    };

    const drag = (e) => {
      if (isDragging) {
        e.preventDefault();
        
        if (e.type === 'touchmove') {
          currentX = e.touches[0].clientX - initialX;
          currentY = e.touches[0].clientY - initialY;
        } else {
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;
        }

        xOffset = currentX;
        yOffset = currentY;

        this.container.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    };

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
  }

  sendMessage() {
    const message = this.inputField.value.trim();
    if (!message) return;
    
    if (this.onSendMessage) {
      this.onSendMessage(message);
    }
    
    this.inputField.value = '';
    this.inputField.focus();
  }

  addMessage(role, content) {
    // Remove welcome message if present
    const welcomeMsg = this.messagesContainer.querySelector('.welcome-message');
    if (welcomeMsg) {
      welcomeMsg.remove();
    }
    
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${role}`;
    
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    contentEl.innerHTML = this.formatMessage(content);
    
    messageEl.appendChild(contentEl);
    this.messagesContainer.appendChild(messageEl);
    
    // Add to messages array
    this.messages.push({ role, content });
    
    // Scroll to bottom
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  formatMessage(content) {
    // Convert markdown-style formatting
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
    
    // Convert timestamps to clickable links
    formatted = formatted.replace(/\[(\d+:\d+(?::\d+)?)\]/g, (match, time) => {
      return `<a class="timestamp-link" data-time="${this.parseTimestamp(time)}">[${time}]</a>`;
    });
    
    return formatted;
  }

  parseTimestamp(timeStr) {
    const parts = timeStr.split(':').reverse();
    let seconds = 0;
    for (let i = 0; i < parts.length; i++) {
      seconds += parseInt(parts[i]) * Math.pow(60, i);
    }
    return seconds;
  }

  setTyping(isTyping) {
    const existingIndicator = this.messagesContainer.querySelector('.typing-indicator');
    
    if (isTyping && !existingIndicator) {
      const indicator = document.createElement('div');
      indicator.className = 'chat-message assistant';
      indicator.innerHTML = `
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      `;
      this.messagesContainer.appendChild(indicator);
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    } else if (!isTyping && existingIndicator) {
      existingIndicator.remove();
    }
  }

  setLoading(isLoading) {
    if (isLoading) {
      const overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = '<div class="loading-spinner"></div>';
      this.container.appendChild(overlay);
    } else {
      const overlay = this.container.querySelector('.loading-overlay');
      if (overlay) overlay.remove();
    }
  }

  showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = message;
    
    this.messagesContainer.appendChild(errorEl);
    
    // Auto-remove after 5 seconds
    setTimeout(() => errorEl.remove(), 5000);
  }

  showWelcomeMessage() {
    this.messagesContainer.innerHTML = `
      <div class="welcome-message">
        <h3>Welcome to YouTube Chat Assistant!</h3>
        <p>I can help you understand and discuss this video. Ask me anything!</p>
        <div class="suggested-prompts">
          <button class="suggested-prompt">Summarize this video</button>
          <button class="suggested-prompt">What are the key points?</button>
          <button class="suggested-prompt">Explain the main concept</button>
        </div>
      </div>
    `;
    
    // Re-attach event listeners for suggested prompts
    this.container.querySelectorAll('.suggested-prompt').forEach(btn => {
      btn.addEventListener('click', () => {
        this.inputField.value = btn.textContent;
        this.sendMessage();
      });
    });
  }

  showExportMenu() {
    const menu = document.createElement('div');
    menu.className = 'export-menu';
    menu.style.cssText = `
      position: absolute;
      top: 40px;
      right: 10px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 8px;
      z-index: 1000;
    `;
    menu.innerHTML = `
      <button class="export-option" data-format="markdown">Export as Markdown</button>
      <button class="export-option" data-format="json">Export as JSON</button>
      <button class="export-option" data-format="text">Export as Text</button>
    `;
    
    // Add styles
    menu.querySelectorAll('.export-option').forEach(btn => {
      btn.style.cssText = `
        display: block;
        width: 100%;
        padding: 8px 12px;
        margin: 4px 0;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        border-radius: 4px;
      `;
      
      btn.addEventListener('mouseover', () => {
        btn.style.background = '#f1f3f4';
      });
      
      btn.addEventListener('mouseout', () => {
        btn.style.background = 'none';
      });
      
      btn.addEventListener('click', () => {
        if (this.onExportChat) {
          this.onExportChat(btn.dataset.format);
        }
        menu.remove();
      });
    });
    
    this.container.querySelector('.chat-header').appendChild(menu);
    
    // Remove menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 100);
  }

  setVideoInfo(info) {
    // Could update the header with video info
    if (info.title) {
      const titleEl = this.container.querySelector('.chat-title');
      titleEl.title = info.title;
    }
  }

  show() {
    this.container.classList.add('visible');
    this.isVisible = true;
  }

  hide() {
    this.container.classList.remove('visible');
    this.isVisible = false;
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    this.container.classList.toggle('minimized', this.isMinimized);
  }

  clearMessages() {
    this.messages = [];
    this.messagesContainer.innerHTML = '';
  }

  loadMessages(messages) {
    this.clearMessages();
    messages.forEach(msg => {
      this.addMessage(msg.role, msg.content);
    });
  }

  getMessages() {
    return this.messages;
  }
}
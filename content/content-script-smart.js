/**
 * YouTube Chat Extension - Smart Content Script
 * Enhanced version with video duration detection for smart routing
 */

// Include all the base functionality from simple version
// (In a real implementation, we'd import/extend, but for Chrome extension we inline)

function extractVideoIdFromPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('v');
  if (videoId) return videoId;
  
  const iframe = document.querySelector('iframe[src*="youtube.com/embed/"]');
  if (iframe) {
    const match = iframe.src.match(/embed\/([0-9A-Za-z_-]{11})/);
    if (match) return match[1];
  }
  
  return null;
}

function getVideoDuration() {
  // Try multiple methods to get video duration
  
  // Method 1: From video element
  const video = document.querySelector('video');
  if (video && video.duration && !isNaN(video.duration)) {
    return Math.floor(video.duration);
  }
  
  // Method 2: From YouTube's player API
  try {
    const player = document.querySelector('#movie_player');
    if (player && player.getDuration) {
      const duration = player.getDuration();
      if (duration && !isNaN(duration)) {
        return Math.floor(duration);
      }
    }
  } catch (e) {
    console.log('Could not get duration from player API:', e);
  }
  
  // Method 3: From duration display
  const durationElement = document.querySelector('.ytp-time-duration');
  if (durationElement) {
    const timeStr = durationElement.textContent;
    const parts = timeStr.split(':').reverse();
    let seconds = 0;
    if (parts[0]) seconds += parseInt(parts[0]); // seconds
    if (parts[1]) seconds += parseInt(parts[1]) * 60; // minutes
    if (parts[2]) seconds += parseInt(parts[2]) * 3600; // hours
    if (!isNaN(seconds) && seconds > 0) {
      return seconds;
    }
  }
  
  // Method 4: From metadata
  try {
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      if (script.textContent.includes('ytInitialPlayerResponse')) {
        const match = script.textContent.match(/"lengthSeconds":\s*"(\d+)"/);
        if (match) {
          return parseInt(match[1]);
        }
      }
    }
  } catch (e) {
    console.log('Could not extract duration from metadata:', e);
  }
  
  return null;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Enhanced extension class with smart routing support
class SmartYouTubeChatExtension {
  constructor() {
    this.currentVideoId = null;
    this.videoDuration = null;
    this.chatUI = null;
    this.transcript = null;
    this.isInitialized = false;
    this.transcriptFetcher = new TranscriptFetcher();
    this.conversationHistory = [];
    this.maxHistoryLength = 10;
    this.smartRoutingStrategy = null;
    
    // Fullscreen tracking
    this.wasVisibleBeforeFullscreen = false;
    this.wasMinimizedBeforeFullscreen = false;
    this.isInFullscreen = false;
    
    this.initializeObservers();
  }

  async initialize() {
    console.log('[Smart YouTube Chat] Initializing...');
    
    // Check for API key first
    const hasApiKey = await this.checkApiKey();
    if (!hasApiKey) {
      console.log('No API key set, but continuing with UI initialization');
      // Don't return - continue with UI setup
    }
    
    // Initialize on YouTube watch pages
    if (window.location.pathname.includes('/watch')) {
      this.detectVideo();
    }
    
    // Create chat UI and bubble
    this.createChatBubble();
    this.createChatUI();
    
    // Hide chat initially
    this.hideChat();
    
    this.isInitialized = true;
    console.log('[Smart YouTube Chat] Initialization complete');
  }

  detectVideo() {
    const videoId = extractVideoIdFromPage();
    
    if (videoId && videoId !== this.currentVideoId) {
      console.log('[Smart] New video detected:', videoId);
      this.currentVideoId = videoId;
      
      // Get video duration for smart routing
      setTimeout(() => {
        this.videoDuration = getVideoDuration();
        console.log('[Smart] Video duration:', this.videoDuration, 'seconds');
        this.loadVideoChat(videoId);
      }, 1000); // Give video time to load
    } else if (!videoId && this.currentVideoId) {
      console.log('[Smart] No video detected, hiding chat');
      this.hideChat();
      this.currentVideoId = null;
      this.videoDuration = null;
    }
  }

  async loadVideoChat(videoId) {
    if (!this.chatUI) return;
    
    console.log('[Smart] Loading chat for video:', videoId);
    
    // Clear previous content
    const messagesContainer = this.chatUI.querySelector('.chat-messages');
    messagesContainer.innerHTML = '';
    this.conversationHistory = [];
    
    // Show loading message
    this.addMessage('system', 'Loading video transcript...');
    
    try {
      // Fetch transcript
      this.transcript = await this.transcriptFetcher.fetchTranscript(videoId);
      
      // Initialize smart routing if we have duration
      if (this.videoDuration) {
        const initResult = await chrome.runtime.sendMessage({
          action: 'initializeVideo',
          videoId: videoId,
          transcript: this.transcript?.segments || this.transcript?.fullText || '',
          duration: this.videoDuration
        });
        
        if (initResult && initResult.success) {
          this.smartRoutingStrategy = initResult.strategy;
          console.log('[Smart] Routing strategy:', this.smartRoutingStrategy);
        }
      }
      
      // Show success message with smart routing info
      messagesContainer.innerHTML = '';
      let welcomeMessage = this.transcript 
        ? `Transcript loaded! I can now answer questions about this video.`
        : `I'm ready to help! (Note: Transcript not available for this video)`;
      
      if (this.smartRoutingStrategy) {
        welcomeMessage += `\n\n🚀 Smart routing enabled: ${this.smartRoutingStrategy.strategy} strategy (${this.smartRoutingStrategy.expectedSavings} cost savings)`;
      }
      
      this.addMessage('assistant', welcomeMessage);
      
      // Enable input
      const input = this.chatUI.querySelector('.chat-input');
      const sendBtn = this.chatUI.querySelector('.chat-send');
      input.disabled = false;
      sendBtn.disabled = false;
      input.placeholder = 'Ask me anything about this video...';
      
      // Load saved chat if exists
      const savedChat = await this.loadSavedChat(videoId);
      if (savedChat && savedChat.messages) {
        messagesContainer.innerHTML = '';
        savedChat.messages.forEach(msg => {
          this.addMessage(msg.role, msg.content);
        });
        this.conversationHistory = savedChat.messages;
      }
      
    } catch (error) {
      console.error('[Smart] Error loading video:', error);
      this.addMessage('system', 'Error loading video data. Please refresh and try again.');
    }
  }

  async sendMessage() {
    const input = this.chatUI.querySelector('.chat-input');
    const message = input.value.trim();
    if (!message) return;
    
    // Add user message
    this.addMessage('user', message);
    input.value = '';
    
    // Add to conversation history
    this.conversationHistory.push({ role: 'user', content: message });
    
    // Show typing indicator
    this.addMessage('assistant', '...thinking...', true);
    
    try {
      // Enhanced context with video ID for smart routing
      const response = await chrome.runtime.sendMessage({
        action: 'generateResponse',
        prompt: message,
        videoId: this.currentVideoId, // Important for smart routing
        context: {
          transcript: this.transcript,
          conversationHistory: this.conversationHistory.slice(-6)
        }
      });
      
      if (response.success) {
        // Remove typing indicator
        const messages = this.chatUI.querySelectorAll('.message');
        const typingMessage = Array.from(messages).find(m => 
          m.querySelector('.content')?.textContent === '...thinking...'
        );
        if (typingMessage) typingMessage.remove();
        
        // Add assistant response
        this.addMessage('assistant', response.response);
        this.conversationHistory.push({ role: 'assistant', content: response.response });
        
        // Show cost savings if available
        if (response.usage && response.usage.savings && parseFloat(response.usage.savings) > 0) {
          console.log(`[Smart] Cost saved: $${response.usage.savings}`);
        }
        
        // Trim history if too long
        if (this.conversationHistory.length > this.maxHistoryLength) {
          this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }
        
        // Auto-save
        await this.autoSaveChat();
      } else {
        throw new Error(response.error || 'Failed to generate response');
      }
    } catch (error) {
      console.error('[Smart] Error sending message:', error);
      
      // Remove typing indicator
      const messages = this.chatUI.querySelectorAll('.message');
      const typingMessage = Array.from(messages).find(m => 
        m.querySelector('.content')?.textContent === '...thinking...'
      );
      if (typingMessage) typingMessage.remove();
      
      this.addMessage('system', `Error: ${error.message}`);
    }
  }

  createChatBubble() {
    if (this.chatBubble) return;
    
    const bubble = document.createElement('div');
    bubble.className = 'youtube-chat-bubble';
    bubble.innerHTML = `
      <svg fill="white" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
      </svg>
    `;
    bubble.title = 'Open YouTube Chat Assistant';
    
    document.body.appendChild(bubble);
    this.chatBubble = bubble;
    
    // Add click handler
    bubble.addEventListener('click', () => {
      this.toggleChat();
    });
  }

  // Include all other methods from simple version
  createChatUI() {
    if (this.chatUI) return;
    
    const container = document.createElement('div');
    container.className = 'youtube-chat-extension';
    // Chat starts hidden by default
    
    container.innerHTML = `
      <div class="chat-header">
        <div class="header-left">
          <button class="new-chat" title="New chat">📝</button>
          <button class="history" title="Chat history">📚</button>
          <button class="export-chat" title="Export chat">💾</button>
          <span class="chat-title">YouTube Chat</span>
        </div>
        <div class="header-controls">
          <button class="minimize">_</button>
          <button class="close">×</button>
        </div>
      </div>
      <div class="chat-messages">
        <div class="welcome-message">
          <h3>Welcome to YouTube Chat Assistant!</h3>
          <p>Enhanced with Smart Routing for 95%+ cost savings</p>
          <p class="loading-message">Loading video transcript...</p>
        </div>
      </div>
      <div class="chat-input-container">
        <button class="chat-clear-btn" title="Clear chat">🗑️</button>
        <input type="text" class="chat-input" placeholder="Ask about the video..." disabled />
        <button class="chat-send" disabled>Send</button>
      </div>
      <div class="chat-history-panel">
        <div class="history-header">
          <h3>Chat History</h3>
          <button class="history-close" type="button">×</button>
        </div>
        <div class="history-search">
          <input type="text" placeholder="Search conversations..." class="history-search-input" />
        </div>
        <div class="history-list">
          <div class="history-empty">
            <p>No saved conversations yet</p>
            <p class="history-hint">Your chat history will appear here</p>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    this.chatUI = container;
    
    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    const container = this.chatUI;
    
    // Header controls
    container.querySelector('.close')?.addEventListener('click', () => this.hideChat());
    container.querySelector('.minimize')?.addEventListener('click', () => this.toggleMinimize());
    container.querySelector('.new-chat')?.addEventListener('click', () => this.startNewChat());
    container.querySelector('.history')?.addEventListener('click', () => this.toggleHistory());
    container.querySelector('.export-chat')?.addEventListener('click', () => this.exportChat());
    container.querySelector('.history-close')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.hideHistory();
    });
    
    // Input controls
    const input = container.querySelector('.chat-input');
    const sendBtn = container.querySelector('.chat-send');
    const clearBtn = container.querySelector('.chat-clear-btn');
    
    sendBtn?.addEventListener('click', () => this.sendMessage());
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
    clearBtn?.addEventListener('click', () => this.clearCurrentChat());
    
    // History search
    container.querySelector('.history-search-input')?.addEventListener('input', (e) => {
      this.filterHistory(e.target.value);
    });
  }

  // Include all other helper methods (addMessage, hideChat, etc.)
  addMessage(role, content, isTyping = false) {
    const messagesContainer = this.chatUI.querySelector('.chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    contentDiv.innerHTML = this.formatMessage(content);
    
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Auto-scroll
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  formatMessage(content) {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/##\s+(.*?)(\n|$)/g, '<h3>$1</h3>')
      .replace(/•/g, '&bull;')
      .replace(/\n/g, '<br>');
  }

  hideChat() {
    if (this.chatUI) {
      this.chatUI.classList.remove('visible');
      setTimeout(() => {
        this.chatUI.style.display = 'none';
      }, 200);
    }
  }

  showChat() {
    if (this.chatUI) {
      this.chatUI.style.display = 'flex';
      // Trigger animation
      setTimeout(() => {
        this.chatUI.classList.add('visible');
      }, 10);
      const input = this.chatUI.querySelector('.chat-input');
      if (input && !input.disabled) {
        setTimeout(() => input.focus(), 300);
      }
    }
  }

  toggleMinimize() {
    this.chatUI.classList.toggle('minimized');
  }

  toggleChat() {
    if (!this.chatUI) return;
    if (this.chatUI.classList.contains('visible')) {
      this.hideChat();
    } else {
      this.showChat();
    }
  }

  async checkApiKey() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkApiKey' });
      return response.success && response.hasApiKey;
    } catch (error) {
      console.error('Error checking API key:', error);
      return false;
    }
  }

  async startNewChat() {
    if (!confirm('Start a new chat? Current conversation will be saved.')) return;
    
    await this.autoSaveChat();
    
    const messagesContainer = this.chatUI.querySelector('.chat-messages');
    messagesContainer.innerHTML = '';
    this.conversationHistory = [];
    
    this.addMessage('assistant', 'New chat started. How can I help you with this video?');
  }

  async autoSaveChat() {
    if (!this.currentVideoId || this.conversationHistory.length === 0) return;
    
    const videoTitle = document.querySelector('h1.ytd-video-primary-info-renderer')?.textContent || 
                      document.querySelector('#title h1')?.textContent || 
                      'Unknown video';
    
    await chrome.runtime.sendMessage({
      action: 'saveChat',
      videoId: this.currentVideoId,
      chatData: {
        videoId: this.currentVideoId,
        title: videoTitle,
        messages: this.conversationHistory,
        smartRouting: this.smartRoutingStrategy
      }
    });
  }

  async loadSavedChat(videoId) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'loadChat',
        videoId: videoId
      });
      return response.success ? response.chatData : null;
    } catch (error) {
      console.error('Error loading chat:', error);
      return null;
    }
  }

  async clearCurrentChat() {
    if (!confirm('Clear current chat? This cannot be undone.')) return;
    
    const messagesContainer = this.chatUI.querySelector('.chat-messages');
    messagesContainer.innerHTML = '';
    this.conversationHistory = [];
    
    this.addMessage('assistant', 'Chat cleared. How can I help you?');
    
    if (this.currentVideoId) {
      await chrome.runtime.sendMessage({
        action: 'clearChat',
        videoId: this.currentVideoId
      });
    }
  }

  async exportChat() {
    if (this.conversationHistory.length === 0) {
      alert('No chat to export');
      return;
    }
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'exportChat',
        videoId: this.currentVideoId,
        format: 'markdown'
      });
      
      if (response.success) {
        const blob = new Blob([response.exportData], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `youtube-chat-${this.currentVideoId}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting chat:', error);
      alert('Failed to export chat');
    }
  }

  async toggleHistory() {
    const panel = this.chatUI.querySelector('.chat-history-panel');
    const isVisible = panel.classList.contains('visible');
    
    if (!isVisible) {
      // Load and display chat history
      await this.loadChatHistory();
    }
    
    panel.classList.toggle('visible');
  }
  
  async loadChatHistory() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getAllChats' });
      if (response.success && response.chats) {
        this.displayChatHistory(response.chats);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }
  
  displayChatHistory(chats) {
    const historyList = this.chatUI.querySelector('.history-list');
    
    if (chats.length === 0) {
      historyList.innerHTML = `
        <div class="history-empty">
          <p>No saved conversations yet</p>
          <p class="history-hint">Your chat history will appear here</p>
        </div>
      `;
      return;
    }
    
    historyList.innerHTML = chats.map(chat => {
      const date = new Date(chat.lastUpdated);
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const messageCount = chat.messages ? chat.messages.length : 0;
      const isCurrentVideo = chat.videoId === this.currentVideoId;
      
      return `
        <div class="history-item ${isCurrentVideo ? 'current' : ''}" data-video-id="${chat.videoId}">
          <div class="history-item-title">${chat.title || 'Untitled Video'}</div>
          <div class="history-item-meta">
            <span>${dateStr} at ${timeStr}</span>
            <span>${messageCount} messages</span>
          </div>
          <div class="history-item-actions">
            ${isCurrentVideo ? 
              '<span class="history-current-badge">Current</span>' : 
              '<button class="history-load-btn" data-video-id="' + chat.videoId + '">Load</button>'
            }
            <button class="history-delete-btn" data-video-id="${chat.videoId}" title="Delete chat">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
    
    // Add click handlers
    historyList.querySelectorAll('.history-load-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const videoId = btn.getAttribute('data-video-id');
        this.loadHistoryItem(videoId);
      });
    });
    
    historyList.querySelectorAll('.history-delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const videoId = btn.getAttribute('data-video-id');
        if (confirm('Delete this chat history?')) {
          await this.deleteHistoryItem(videoId);
        }
      });
    });
  }
  
  async loadHistoryItem(videoId) {
    // Navigate to the video
    window.location.href = `https://www.youtube.com/watch?v=${videoId}`;
    this.hideHistory();
  }
  
  async deleteHistoryItem(videoId) {
    try {
      await chrome.runtime.sendMessage({ 
        action: 'clearChat', 
        videoId: videoId 
      });
      
      // Reload the history
      await this.loadChatHistory();
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  }

  hideHistory() {
    const panel = this.chatUI.querySelector('.chat-history-panel');
    panel.classList.remove('visible');
  }

  filterHistory(searchTerm) {
    // Implementation for filtering history
    console.log('Filtering history:', searchTerm);
  }

  initializeObservers() {
    // Watch for URL changes
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        console.log('[Smart] URL changed, checking for video');
        debounce(() => this.detectVideo(), 500)();
      }
    }).observe(document, { subtree: true, childList: true });
    
    // Watch for fullscreen changes
    document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
    
    // Initial detection
    setTimeout(() => this.detectVideo(), 1000);
  }

  handleFullscreenChange() {
    const isFullscreen = !!document.fullscreenElement;
    
    if (isFullscreen && !this.isInFullscreen) {
      // Entering fullscreen
      this.isInFullscreen = true;
      if (this.chatUI) {
        this.wasVisibleBeforeFullscreen = this.chatUI.style.display !== 'none';
        this.wasMinimizedBeforeFullscreen = this.chatUI.classList.contains('minimized');
        this.hideChat();
      }
    } else if (!isFullscreen && this.isInFullscreen) {
      // Exiting fullscreen
      this.isInFullscreen = false;
      if (this.wasVisibleBeforeFullscreen && this.chatUI) {
        this.showChat();
        if (!this.wasMinimizedBeforeFullscreen) {
          this.chatUI.classList.remove('minimized');
        }
      }
    }
  }
}

// Initialize smart extension
const smartExtension = new SmartYouTubeChatExtension();

// Wait for DOM and initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => smartExtension.initialize());
} else {
  smartExtension.initialize();
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleChat') {
    smartExtension.toggleChat();
  }
});

// Listen for cost analysis requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCostInfo') {
    chrome.runtime.sendMessage({ action: 'getCostAnalysis' }, (response) => {
      if (response.success) {
        console.log('[Smart] Cost Analysis:', response.analysis);
        sendResponse(response.analysis);
      }
    });
    return true; // Keep channel open for async response
  }
});
/**
 * YouTube Chat Extension - Smart Content Script
 * Enhanced version with video duration detection for smart routing
 */

console.log('[YouTube Chat] Content script loading...');

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

// Add immediate visual feedback
console.log('%c[Smart YouTube Chat] Extension loaded!', 'background: #4CAF50; color: white; font-size: 14px; padding: 5px;');

// Enhanced extension class with smart routing support
class SmartYouTubeChatExtension {
  constructor() {
    console.log('[Smart YouTube Chat] Constructor called');
    this.currentVideoId = null;
    this.videoDuration = null;
    this.chatUI = null;
    this.transcript = null;
    this.isInitialized = false;
    
    // Check if TranscriptFetcher is available
    if (typeof TranscriptFetcher !== 'undefined') {
      console.log('[Smart YouTube Chat] TranscriptFetcher found, creating instance');
      this.transcriptFetcher = new TranscriptFetcher();
    } else {
      console.error('[Smart YouTube Chat] TranscriptFetcher not found!');
      this.transcriptFetcher = null;
    }
    
    this.conversationHistory = [];
    this.maxHistoryLength = 10;
    this.smartRoutingStrategy = null;
    
    // Connection and state management
    this.isProcessingRequest = false;
    this.connectionStatus = 'connected';
    this.lastConnectionCheck = Date.now();
    this.retryAttempts = 0;
    this.maxRetryAttempts = 3;
    
    // Fullscreen tracking
    this.wasVisibleBeforeFullscreen = false;
    this.wasMinimizedBeforeFullscreen = false;
    this.wasMaximizedBeforeFullscreen = false;
    this.isInFullscreen = false;
    
    // Maximize state
    this.isMaximized = false;
    this.backdrop = null;
    
    // Chat history
    this.allChats = [];
    
    this.initializeObservers();
    this.startConnectionMonitoring();
  }

  startConnectionMonitoring() {
    // Check connection health every 30 seconds
    setInterval(async () => {
      await this.checkConnectionHealth();
    }, 30000);
  }

  async checkConnectionHealth() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'healthCheck' });
      if (response && response.success) {
        this.connectionStatus = 'connected';
        this.retryAttempts = 0;
        this.updateConnectionUI();
      } else {
        this.connectionStatus = 'disconnected';
        this.updateConnectionUI();
      }
    } catch (error) {
      console.error('[YouTube Chat] Connection health check failed:', error);
      this.connectionStatus = 'disconnected';
      this.updateConnectionUI();
    }
  }

  updateConnectionUI() {
    if (!this.chatUI) return;
    
    const statusIndicator = this.chatUI.querySelector('.connection-status');
    if (statusIndicator) {
      statusIndicator.className = `connection-status ${this.connectionStatus}`;
      statusIndicator.title = this.connectionStatus === 'connected' 
        ? 'Connected to extension background' 
        : 'Connection lost - trying to reconnect...';
    }
  }

  async attemptReconnection() {
    if (this.retryAttempts >= this.maxRetryAttempts) {
      console.log('[YouTube Chat] Max reconnection attempts reached');
      this.showConnectionError();
      return false;
    }

    this.retryAttempts++;
    console.log(`[YouTube Chat] Attempting reconnection (${this.retryAttempts}/${this.maxRetryAttempts})`);
    
    try {
      const response = await chrome.runtime.sendMessage({ action: 'reconnect' });
      if (response && response.success) {
        this.connectionStatus = 'connected';
        this.retryAttempts = 0;
        this.updateConnectionUI();
        console.log('[YouTube Chat] Reconnection successful');
        return true;
      }
    } catch (error) {
      console.error('[YouTube Chat] Reconnection failed:', error);
    }
    
    // Wait before next attempt (exponential backoff)
    const delay = Math.pow(2, this.retryAttempts) * 1000;
    setTimeout(() => this.attemptReconnection(), delay);
    return false;
  }

  showConnectionError() {
    this.addMessage('system', 'Connection lost. Please refresh the page to restore functionality.');
    this.resetUIState();
  }

  resetUIState() {
    // Always ensure UI is in a usable state
    if (!this.chatUI) return;
    
    const input = this.chatUI.querySelector('.chat-input');
    const sendBtn = this.chatUI.querySelector('.chat-send');
    
    if (input) {
      input.disabled = false;
      input.placeholder = 'Ask me anything about this video...';
    }
    if (sendBtn) {
      sendBtn.disabled = false;
    }
    
    // Remove any typing indicators
    this.removeTypingIndicator();
    
    // Reset processing state
    this.isProcessingRequest = false;
  }

  removeTypingIndicator() {
    if (!this.chatUI) return;
    const messages = this.chatUI.querySelectorAll('.message');
    const typingMessage = Array.from(messages).find(m => 
      m.querySelector('.content')?.textContent === '...thinking...'
    );
    if (typingMessage) typingMessage.remove();
  }

  async initialize() {
    console.log('[Smart YouTube Chat] Initializing... v2.1 with search fix');
    console.log('[Smart YouTube Chat] Features: Channel extraction, History search, Debug logging');
    console.log('[Smart YouTube Chat] Current URL:', window.location.href);
    console.log('[Smart YouTube Chat] Current pathname:', window.location.pathname);
    
    try {
      // Skip API key check for now to ensure UI loads
      console.log('[Smart YouTube Chat] Skipping API key check to ensure UI loads');
      
      // We'll check API key later when user tries to send a message
      const hasApiKey = false;
      
      // Initialize on YouTube watch pages
      if (window.location.pathname.includes('/watch')) {
        console.log('[Smart YouTube Chat] On watch page, will detect video after delay');
        // Delay video detection to ensure player is ready
        setTimeout(() => {
          console.log('[Smart YouTube Chat] Starting delayed video detection');
          this.detectVideo();
        }, 2000);
      } else {
        console.log('[Smart YouTube Chat] Not on watch page, still creating UI');
      }
      
      // Create chat UI and bubble
      console.log('[Smart YouTube Chat] Creating chat bubble...');
      this.createChatBubble();
      
      console.log('[Smart YouTube Chat] Creating chat UI...');
      this.createChatUI();
      
      // Hide chat initially
      this.hideChat();
      
      this.isInitialized = true;
      console.log('[Smart YouTube Chat] Initialization complete');
      console.log('[Smart YouTube Chat] Checking final DOM state:');
      console.log('[Smart YouTube Chat] - Bubble exists:', !!document.querySelector('.youtube-chat-bubble'));
      console.log('[Smart YouTube Chat] - Chat UI exists:', !!document.querySelector('.youtube-chat-extension'));
    } catch (error) {
      console.error('[Smart YouTube Chat] Initialization error:', error);
      console.error('[Smart YouTube Chat] Error stack:', error.stack);
    }
  }

  createChatBubble() {
    console.log('[Smart YouTube Chat] createChatBubble called');
    
    // Check if bubble already exists
    const existingBubble = document.querySelector('.youtube-chat-bubble');
    if (existingBubble) {
      console.log('[Smart YouTube Chat] Bubble already exists');
      return;
    }

    console.log('[Smart YouTube Chat] Creating new bubble element');
    const bubble = document.createElement('div');
    bubble.className = 'youtube-chat-bubble';
    bubble.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    bubble.title = 'Open YouTube Chat Assistant';
    
    console.log('[Smart YouTube Chat] Adding click handler to bubble');
    // Add click handler
    bubble.addEventListener('click', () => {
      console.log('[Smart YouTube Chat] Bubble clicked');
      this.toggleChat();
    });
    
    console.log('[Smart YouTube Chat] Appending bubble to body');
    document.body.appendChild(bubble);
    
    // Store reference
    this.chatBubble = bubble;
    
    console.log('[Smart YouTube Chat] Chat bubble created successfully');
    console.log('[Smart YouTube Chat] Bubble element:', bubble);
    console.log('[Smart YouTube Chat] Bubble in DOM:', document.querySelector('.youtube-chat-bubble'));
  }

  detectVideo() {
    const videoId = extractVideoIdFromPage();
    console.log('[Smart] detectVideo called, videoId:', videoId, 'currentVideoId:', this.currentVideoId);
    
    if (videoId && videoId !== this.currentVideoId) {
      console.log('[Smart] New video detected:', videoId);
      this.currentVideoId = videoId;
      
      // Get video duration for smart routing
      setTimeout(() => {
        this.videoDuration = getVideoDuration();
        const durationMinutes = this.videoDuration ? Math.floor(this.videoDuration / 60) : 0;
        const durationSeconds = this.videoDuration ? this.videoDuration % 60 : 0;
        console.log(`[Smart] Video duration: ${this.videoDuration} seconds (${durationMinutes}:${durationSeconds.toString().padStart(2, '0')})`);
        this.loadVideoChat(videoId);
      }, 1000); // Give video time to load
    } else if (!videoId && this.currentVideoId) {
      console.log('[Smart] No video detected, hiding chat');
      this.hideChat();
      this.currentVideoId = null;
      this.videoDuration = null;
    } else if (videoId && videoId === this.currentVideoId) {
      console.log('[Smart] Same video, no reload needed');
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
      console.log('[Smart] Starting transcript fetch for video:', videoId);
      this.transcript = await this.transcriptFetcher.fetchTranscript(videoId);
      console.log('[Smart] Transcript fetch completed:', {
        hasTranscript: !!this.transcript,
        transcriptResult: this.transcript
      });
      
      // Handle null transcript
      if (!this.transcript) {
        console.log('[Smart] Transcript is null, continuing without transcript');
        this.transcript = null;
      }
      
      // Debug logging for fetched transcript
      console.log('[ChatUI] Transcript fetched:', {
        hasTranscript: !!this.transcript,
        transcriptType: this.transcript ? typeof this.transcript : 'undefined',
        transcriptKeys: this.transcript ? Object.keys(this.transcript) : [],
        fullTextLength: this.transcript?.fullText?.length || 0,
        segmentsCount: this.transcript?.segments?.length || 0,
        hasFullText: !!this.transcript?.fullText,
        hasSegments: !!this.transcript?.segments,
        firstSegment: this.transcript?.segments?.[0],
        transcriptSample: this.transcript?.fullText?.substring(0, 100) || 'No transcript text'
      });
      
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
      
      // Show success message with smart routing info and video details
      messagesContainer.innerHTML = '';
      
      const durationMinutes = this.videoDuration ? Math.floor(this.videoDuration / 60) : 0;
      const durationSeconds = this.videoDuration ? this.videoDuration % 60 : 0;
      const durationStr = this.videoDuration ? 
        `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}` : 'unknown';
      
      // Check if transcript is properly loaded
      if (!this.transcript || (!this.transcript.fullText && !this.transcript.segments)) {
        console.warn('[ChatUI] No transcript available for this video');
        let errorMessage = `⚠️ Transcript not available for this video.\n\nPossible reasons:\n`;
        errorMessage += `• The video doesn't have captions/subtitles\n`;
        errorMessage += `• The transcript is still loading\n`;
        errorMessage += `• There was an error fetching the transcript\n\n`;
        errorMessage += `I can still try to help based on general knowledge, but I won't have specific information about this video's content.`;
        
        this.addMessage('assistant', errorMessage);
      } else {
        let welcomeMessage = `✅ Transcript loaded successfully! I can now answer questions about this video.`;
        
        // Add transcript stats
        const transcriptLength = this.transcript.fullText?.length || 0;
        const segmentCount = this.transcript.segments?.length || 0;
        welcomeMessage += `\n\n📊 **Transcript Stats**:`;
        welcomeMessage += `\n• ${transcriptLength.toLocaleString()} characters`;
        welcomeMessage += `\n• ${segmentCount} segments`;
        
        welcomeMessage += `\n\n📺 **Video Duration**: ${durationStr}`;
        
        // Add timestamp availability info
        const validTimestamps = this.getValidTimestampsFromTranscript();
        if (validTimestamps.length > 0) {
          welcomeMessage += `\n⏱️ **Available Timestamps**: ${validTimestamps.length} precise time references`;
        } else {
          welcomeMessage += `\n⏱️ **Timestamps**: Smart validation enabled`;
        }
        
        if (this.smartRoutingStrategy) {
          welcomeMessage += `\n\n🚀 Smart routing enabled: ${this.smartRoutingStrategy.strategy} strategy (${this.smartRoutingStrategy.expectedSavings} cost savings)`;
        }
        
        this.addMessage('assistant', welcomeMessage);
      }
      
      // Enable input and ensure proper state
      this.resetUIState();
      
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
      console.error('[Smart] Error details:', {
        message: error.message,
        stack: error.stack,
        transcriptStatus: this.transcript ? 'partially loaded' : 'not loaded'
      });
      
      let errorMessage = 'Error loading video data: ' + error.message;
      if (!this.transcript) {
        errorMessage += '\n\nThe transcript could not be loaded. You can still chat, but I won\'t have specific information about this video.';
      }
      
      this.addMessage('system', errorMessage);
      // Ensure UI is still usable even after errors
      this.resetUIState();
    }
  }

  async sendMessage() {
    // Prevent multiple simultaneous requests
    if (this.isProcessingRequest) {
      console.log('[YouTube Chat] Request already in progress, ignoring new request');
      return;
    }

    const input = this.chatUI.querySelector('.chat-input');
    const sendBtn = this.chatUI.querySelector('.chat-send');
    const message = input.value.trim();
    
    // Validate input and UI state
    if (!message) {
      input.focus();
      return;
    }
    
    if (!input || !sendBtn) {
      console.error('[YouTube Chat] UI elements not found');
      return;
    }

    // Validate connection before proceeding
    if (this.connectionStatus !== 'connected') {
      this.addMessage('system', 'Connection lost. Attempting to reconnect...');
      const reconnected = await this.attemptReconnection();
      if (!reconnected) {
        return;
      }
    }

    // Lock UI during processing
    this.isProcessingRequest = true;
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    
    try {
      // Add user message
      this.addMessage('user', message);
      input.value = '';
      
      // Add to conversation history
      this.conversationHistory.push({ role: 'user', content: message });
      
      // Show typing indicator
      this.addMessage('assistant', '...thinking...', true);
      
      // Debug logging for transcript
      console.log('[ChatUI] Sending message with context:', {
        hasTranscript: !!this.transcript,
        transcriptType: this.transcript ? typeof this.transcript : 'undefined',
        transcriptKeys: this.transcript ? Object.keys(this.transcript) : [],
        transcriptFullTextLength: this.transcript?.fullText?.length || 0,
        transcriptSegmentsCount: this.transcript?.segments?.length || 0,
        conversationHistoryLength: this.conversationHistory.length,
        videoDuration: this.videoDuration
      });
      
      // Generate response with retry logic
      const response = await this.generateResponseWithRetry({
        action: 'generateResponse',
        prompt: message,
        videoId: this.currentVideoId,
        context: {
          transcript: this.transcript,
          conversationHistory: this.conversationHistory.slice(-6),
          videoDuration: this.videoDuration
        }
      });
      
      if (response.success) {
        // Remove typing indicator
        this.removeTypingIndicator();
        
        // Debug: Log the raw response from Gemini
        console.log('[YouTube Chat] Raw Gemini response:', response.response.substring(0, 500));
        
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
        // Handle different types of errors
        if (response.needsReconnection) {
          console.log('[YouTube Chat] Service worker needs reconnection');
          await this.attemptReconnection();
        }
        throw new Error(response.error || 'Failed to generate response');
      }
    } catch (error) {
      console.error('[Smart] Error sending message:', error);
      
      // Remove typing indicator
      this.removeTypingIndicator();
      
      // Show user-friendly error message
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      if (error.message.includes('API key')) {
        errorMessage = 'Please set your Gemini API key in the extension settings.';
      } else if (error.message.includes('Service unavailable')) {
        errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
      }
      
      this.addMessage('system', errorMessage);
    } finally {
      // Always restore UI state
      this.resetUIState();
    }
  }

  async generateResponseWithRetry(request, retryCount = 0) {
    const maxRetries = 3;
    
    try {
      const response = await chrome.runtime.sendMessage(request);
      
      // Check if response indicates connection issues
      if (!response || response.needsReconnection) {
        throw new Error('Connection lost');
      }
      
      return response;
    } catch (error) {
      console.error(`[YouTube Chat] API request failed (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        // Try to reconnect before retry
        if (error.message.includes('Connection lost') || error.message.includes('Extension context invalidated')) {
          const reconnected = await this.attemptReconnection();
          if (!reconnected) {
            throw new Error('Unable to reconnect to extension service');
          }
        }
        
        // Wait before retry with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.generateResponseWithRetry(request, retryCount + 1);
      }
      
      throw error;
    }
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
          <div class="connection-status connected" title="Connected to extension background"></div>
        </div>
        <div class="header-controls">
          <button class="maximize" title="Maximize chat">⛶</button>
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
    
    // Create backdrop for maximized mode
    const backdrop = document.createElement('div');
    backdrop.className = 'youtube-chat-backdrop';
    document.body.appendChild(backdrop);
    this.backdrop = backdrop;
    
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
    container.querySelector('.maximize')?.addEventListener('click', () => this.toggleMaximize());
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
    const searchInput = container.querySelector('.history-search-input');
    console.log('[YouTube Chat] Setting up search input listener:', searchInput);
    searchInput?.addEventListener('input', (e) => {
      console.log('[YouTube Chat] Search input changed:', e.target.value);
      this.filterHistory(e.target.value);
    });
    
    // Backdrop click handler
    if (this.backdrop) {
      this.backdrop.addEventListener('click', () => {
        if (this.isMaximized) {
          this.toggleMaximize();
        }
      });
    }
    
    // ESC key handler for maximized mode
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMaximized) {
        this.toggleMaximize();
      }
    });
  }

  // Include all other helper methods (addMessage, hideChat, etc.)
  addMessage(role, content, isTyping = false) {
    const messagesContainer = this.chatUI.querySelector('.chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role} chat-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'content chat-content';
    
    // Store original content for repurpose feature
    const originalContent = content;
    
    if (role === 'assistant') {
      // Process timestamps first, then simple markdown (like the working archive version)
      content = this.processTimestamps(content);
      content = this.processSimpleMarkdown(content);
      
      // Log timestamp validation to console only
      if (role === 'assistant' && originalContent !== content && originalContent.includes('[') && originalContent.includes(']')) {
        this.logTimestampValidation(originalContent, content);
      }
    } else {
      // For user messages, escape HTML to prevent XSS
      content = this.escapeHtml(content);
    }
    
    contentDiv.innerHTML = content;
    messageDiv.appendChild(contentDiv);
    
    // Add copy button for assistant messages
    if (role === 'assistant') {
      const copyButton = document.createElement('button');
      copyButton.className = 'message-copy-btn';
      copyButton.innerHTML = `
        <svg class="copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      copyButton.title = 'Copy to clipboard';
      
      // Add click handler
      copyButton.addEventListener('click', () => {
        this.copyMessageToClipboard(originalContent, copyButton);
      });
      
      messageDiv.appendChild(copyButton);
    }
    
    messagesContainer.appendChild(messageDiv);
    
    // Add repurpose button AFTER the message is added to DOM
    if (role === 'assistant' && originalContent.length > 100) {
      console.log('[YouTube Chat] Adding repurpose button, content length:', originalContent.length);
      this.addRepurposeButtonAfterMessage(messageDiv, originalContent);
    }
    
    // Auto-scroll
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add click handlers for timestamps in the new message
    this.addTimestampClickHandlers(contentDiv);
  }

  logTimestampValidation(originalContent, processedContent) {
    // Count original vs processed timestamps
    const originalTimestamps = (originalContent.match(/\[?\d{1,2}:\d{2}\]?/g) || []).length;
    const processedTimestamps = (processedContent.match(/timestamp-link/g) || []).length;
    const removedCount = originalTimestamps - processedTimestamps;
    
    if (removedCount > 0) {
      console.log(`[YouTube Chat] Timestamp Validation: ${removedCount} invalid timestamp${removedCount > 1 ? 's' : ''} replaced with descriptive text`);
      if (this.videoDuration) {
        console.log(`[YouTube Chat] Video duration: ${this.secondsToTimestamp(this.videoDuration)}`);
      }
      
      // Log details for debugging
      const invalidTimestamps = originalContent.match(/\[?\d{1,2}:\d{2}\]?/g) || [];
      invalidTimestamps.forEach(ts => {
        const [minutes, seconds] = ts.replace(/[\[\]]/g, '').split(':').map(Number);
        const totalSeconds = minutes * 60 + seconds;
        if (totalSeconds > this.videoDuration) {
          console.log(`[YouTube Chat] Invalid timestamp detected: ${ts} (${totalSeconds}s > ${this.videoDuration}s)`);
        }
      });
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  processSimpleMarkdown(content) {
    // ChatGPT-4o inspired markdown processing with cleaner output
    let processed = content;
    
    // Process code blocks first to protect their content
    const codeBlocks = [];
    processed = processed.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push(`<pre class="chat-code-block" data-lang="${lang || 'plaintext'}"><code>${this.escapeHtml(code.trim())}</code></pre>`);
      return placeholder;
    });
    
    // Process inline code to protect from further processing
    const inlineCode = [];
    processed = processed.replace(/`([^`]+)`/g, (match, code) => {
      const placeholder = `__INLINE_CODE_${inlineCode.length}__`;
      inlineCode.push(`<code class="chat-inline-code">${this.escapeHtml(code)}</code>`);
      return placeholder;
    });
    
    // Headers (reduced hierarchy like GPT-4o)
    processed = processed
      .replace(/^#{1,2} (.+)$/gm, '<h2 class="chat-heading">$1</h2>')
      .replace(/^#{3,6} (.+)$/gm, '<h3 class="chat-subheading">$1</h3>');
    
    // Lists with better structure - process before other markdown
    // First, handle bullet points at the start of lines
    processed = processed.replace(/^[\*\-] (.+)$/gm, '<li class="chat-list-item">$1</li>');
    processed = processed.replace(/^\d+\. (.+)$/gm, '<li class="chat-numbered-item">$1</li>');
    
    // Wrap consecutive list items
    processed = processed.replace(/(<li class="chat-list-item">[\s\S]*?<\/li>\s*)+/g, (match) => {
      return `<ul class="chat-list">${match}</ul>`;
    });
    
    processed = processed.replace(/(<li class="chat-numbered-item">[\s\S]*?<\/li>\s*)+/g, (match) => {
      return `<ol class="chat-list" style="counter-reset: list-counter;">${match}</ol>`;
    });
    
    // Bold and italic - process after lists to avoid conflicts
    processed = processed
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Match italic only when not at start of line and not part of bold
      .replace(/([^*\n])\*([^*\n]+?)\*([^*])/g, '$1<em>$2</em>$3');
    
    // Blockquotes
    processed = processed.replace(/^> (.+)$/gm, '<blockquote class="chat-blockquote">$1</blockquote>');
    
    // Horizontal rules
    processed = processed.replace(/^---+$/gm, '<hr class="chat-hr">');
    
    // Links
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    
    // Paragraphs and line breaks
    processed = processed
      .split('\n\n')
      .map(para => para.trim() ? `<p>${para.replace(/\n/g, '<br>')}</p>` : '')
      .join('');
    
    // Restore code blocks and inline code
    codeBlocks.forEach((block, i) => {
      processed = processed.replace(`__CODE_BLOCK_${i}__`, block);
    });
    
    inlineCode.forEach((code, i) => {
      processed = processed.replace(`__INLINE_CODE_${i}__`, code);
    });
    
    return processed;
  }

  formatMessage(content) {
    // Just return the content as-is since timestamps are processed separately
    return content;
  }

  processTimestamps(text) {
    const validTimestamps = this.getValidTimestampsFromTranscript();
    let invalidTimestampCount = 0;
    
    const processedText = text.replace(/\[?(\d{1,2}):(\d{2})\]?/g, (match, minutes, seconds) => {
      const totalSeconds = parseInt(minutes) * 60 + parseInt(seconds);
      const timestampStr = `${minutes}:${seconds}`;
      
      // Multi-layer validation
      if (!this.isValidTimestamp(totalSeconds, timestampStr, validTimestamps)) {
        invalidTimestampCount++;
        console.warn(`[YouTube Chat] Removing invalid timestamp ${match} - not found in video`);
        
        // Replace with intelligent descriptive text
        return this.getDescriptiveTimeReference(totalSeconds);
      }
      
      return `<a href="#" class="timestamp-link" data-time="${totalSeconds}">[${minutes}:${seconds}]</a>`;
    });
    
    // Log validation results
    if (invalidTimestampCount > 0) {
      console.log(`[YouTube Chat] Removed ${invalidTimestampCount} invalid timestamp(s), replaced with descriptive text`);
    }
    
    return processedText;
  }

  isValidTimestamp(totalSeconds, timestampStr, validTimestamps) {
    // Layer 1: Check against video duration
    if (this.videoDuration && totalSeconds > this.videoDuration) {
      return false;
    }
    
    // Layer 2: Check against transcript timestamps (if available)
    if (validTimestamps.length > 0) {
      // Allow some tolerance for slight timing differences
      const tolerance = 5; // 5 seconds
      return validTimestamps.some(validTime => {
        const [vMin, vSec] = validTime.split(':').map(Number);
        const validTotalSeconds = vMin * 60 + vSec;
        return Math.abs(validTotalSeconds - totalSeconds) <= tolerance;
      });
    }
    
    // Layer 3: If no transcript timestamps available, just check duration
    return this.videoDuration ? totalSeconds <= this.videoDuration : true;
  }

  getValidTimestampsFromTranscript() {
    if (!this.transcript) return [];
    
    const timestamps = [];
    
    if (Array.isArray(this.transcript.segments)) {
      this.transcript.segments.forEach(segment => {
        if (segment.start !== undefined) {
          const minutes = Math.floor(segment.start / 60);
          const seconds = Math.floor(segment.start % 60);
          timestamps.push(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      });
    } else if (this.transcript.fullTextWithTimestamps) {
      // Extract from full text with timestamps
      const timestampRegex = /\[(\d{1,2}):(\d{2})\]/g;
      let match;
      while ((match = timestampRegex.exec(this.transcript.fullTextWithTimestamps)) !== null) {
        timestamps.push(`${match[1]}:${match[2]}`);
      }
    }
    
    return [...new Set(timestamps)]; // Remove duplicates
  }

  getDescriptiveTimeReference(totalSeconds) {
    if (!this.videoDuration) {
      return ''; // Remove timestamp entirely if no video duration
    }
    
    const videoProgress = totalSeconds / this.videoDuration;
    
    if (videoProgress < 0.2) {
      return '<span class="descriptive-time">early in the video</span>';
    } else if (videoProgress < 0.4) {
      return '<span class="descriptive-time">in the first part</span>';
    } else if (videoProgress < 0.6) {
      return '<span class="descriptive-time">around the middle</span>';
    } else if (videoProgress < 0.8) {
      return '<span class="descriptive-time">in the latter part</span>';
    } else {
      return '<span class="descriptive-time">towards the end</span>';
    }
  }

  addTimestampClickHandlers(element) {
    const timestamps = element.querySelectorAll('.timestamp-link');
    console.log(`[YouTube Chat] Adding click handlers to ${timestamps.length} timestamps`);
    
    timestamps.forEach((timestamp, index) => {
      const timeStr = timestamp.getAttribute('data-time');
      console.log(`[YouTube Chat] Timestamp ${index + 1}: ${timeStr} seconds`);
      
      // Add new handler
      timestamp.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log(`[YouTube Chat] Timestamp clicked: ${timeStr} seconds`);
        this.seekToTimestamp(parseInt(timeStr));
      });
      
      // Add visual feedback for debugging
      timestamp.style.cursor = 'pointer';
      timestamp.title = `Click to jump to ${this.secondsToTimestamp(parseInt(timeStr))}`;
    });
  }

  seekToTimestamp(seconds) {
    try {
      // Try multiple methods to control YouTube player
      this.controlYouTubePlayer(seconds);
      
      console.log(`[YouTube Chat] Seeking to ${this.secondsToTimestamp(seconds)} (${seconds} seconds)`);
    } catch (error) {
      console.error('[YouTube Chat] Error seeking to timestamp:', error);
    }
  }

  parseTimestamp(timeStr) {
    const parts = timeStr.split(':').map(part => parseInt(part, 10));
    
    if (parts.length === 2) {
      // MM:SS format
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // H:MM:SS format
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    
    throw new Error('Invalid timestamp format');
  }

  controlYouTubePlayer(seconds) {
    console.log('[YouTube Chat] Attempting to seek to:', seconds, 'seconds');
    
    // Method 1: YouTube's global player object (most reliable)
    if (window.ytPlayer && typeof window.ytPlayer.seekTo === 'function') {
      try {
        window.ytPlayer.seekTo(seconds, true);
        console.log('[YouTube Chat] Used global ytPlayer');
        return;
      } catch (error) {
        console.log('[YouTube Chat] Global ytPlayer failed:', error);
      }
    }

    // Method 2: Direct video element control
    const player = document.querySelector('video');
    if (player) {
      try {
        player.currentTime = seconds;
        console.log('[YouTube Chat] Controlled video element directly');
        return;
      } catch (error) {
        console.log('[YouTube Chat] Direct video control failed:', error);
      }
    }

    // Method 3: YouTube's movie_player element
    const moviePlayer = document.querySelector('#movie_player');
    if (moviePlayer && moviePlayer.seekTo) {
      try {
        moviePlayer.seekTo(seconds, true);
        console.log('[YouTube Chat] Used movie_player.seekTo');
        return;
      } catch (error) {
        console.log('[YouTube Chat] movie_player.seekTo failed:', error);
      }
    }

    // Method 4: Try accessing YouTube's internal APIs
    if (window.yt && window.yt.player && window.yt.player.getPlayerByElement) {
      try {
        const playerElement = document.querySelector('#movie_player');
        const player = window.yt.player.getPlayerByElement(playerElement);
        if (player && player.seekTo) {
          player.seekTo(seconds, true);
          console.log('[YouTube Chat] Used yt.player API');
          return;
        }
      } catch (error) {
        console.log('[YouTube Chat] yt.player API failed:', error);
      }
    }

    // Method 5: Keyboard shortcut simulation (fallback)
    try {
      // Focus the video player first
      const video = document.querySelector('video');
      if (video) {
        video.focus();
        
        // Create a synthetic key event for 't' which opens timestamp input
        const keyEvent = new KeyboardEvent('keydown', {
          key: 't',
          code: 'KeyT',
          keyCode: 84,
          which: 84,
          bubbles: true
        });
        document.dispatchEvent(keyEvent);
        
        // Wait a bit then try to input the timestamp
        setTimeout(() => {
          const timestampInput = document.querySelector('input[type="text"]');
          if (timestampInput) {
            timestampInput.value = this.secondsToTimestamp(seconds);
            timestampInput.dispatchEvent(new Event('input', { bubbles: true }));
            timestampInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          }
        }, 100);
        
        console.log('[YouTube Chat] Used keyboard shortcut method');
        return;
      }
    } catch (error) {
      console.log('[YouTube Chat] Keyboard shortcut failed:', error);
    }

    // Method 6: URL parameter change (last resort)
    try {
      const currentUrl = new URL(window.location);
      currentUrl.searchParams.set('t', `${seconds}s`);
      window.location.href = currentUrl.toString();
      console.log('[YouTube Chat] Used URL reload method');
    } catch (error) {
      console.error('[YouTube Chat] All timestamp methods failed:', error);
      
      // Show user feedback
      this.showTimestampError(seconds);
    }
  }

  secondsToTimestamp(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  showTimestampError(seconds) {
    const timestamp = this.secondsToTimestamp(seconds);
    console.warn(`[YouTube Chat] Could not seek to ${timestamp}. Try manually seeking to this time.`);
    
    // Could add a visual notification here if needed
  }

  hideChat() {
    console.log('[Smart YouTube Chat] hideChat called');
    if (this.chatUI) {
      this.chatUI.classList.remove('visible');
      this.chatUI.style.display = 'none';
      console.log('[Smart YouTube Chat] Chat UI hidden');
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

  toggleMaximize() {
    if (!this.chatUI || !this.backdrop) return;
    
    this.isMaximized = !this.isMaximized;
    
    if (this.isMaximized) {
      // Entering maximized mode
      this.chatUI.classList.add('maximized');
      this.backdrop.classList.add('visible');
      document.body.style.overflow = 'hidden'; // Prevent body scroll
      
      // Update maximize button
      const maximizeBtn = this.chatUI.querySelector('.maximize');
      if (maximizeBtn) {
        maximizeBtn.textContent = '⊡'; // Restore icon
        maximizeBtn.title = 'Restore chat';
      }
      
      console.log('[YouTube Chat] Entered maximized mode');
    } else {
      // Exiting maximized mode
      this.chatUI.classList.remove('maximized');
      this.backdrop.classList.remove('visible');
      document.body.style.overflow = ''; // Restore body scroll
      
      // Update maximize button
      const maximizeBtn = this.chatUI.querySelector('.maximize');
      if (maximizeBtn) {
        maximizeBtn.textContent = '⛶'; // Maximize icon
        maximizeBtn.title = 'Maximize chat';
      }
      
      console.log('[YouTube Chat] Exited maximized mode');
    }
  }

  async copyMessageToClipboard(content, button) {
    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(content);
      
      // Show success state
      const copyIcon = button.querySelector('.copy-icon');
      const checkIcon = button.querySelector('.check-icon');
      
      // Hide copy icon, show check icon
      copyIcon.style.display = 'none';
      checkIcon.style.display = 'block';
      
      // Add success class for green color
      button.classList.add('success');
      
      // Reset after 2 seconds
      setTimeout(() => {
        copyIcon.style.display = 'block';
        checkIcon.style.display = 'none';
        button.classList.remove('success');
      }, 2000);
      
      console.log('[YouTube Chat] Message copied to clipboard');
    } catch (error) {
      console.error('[YouTube Chat] Failed to copy to clipboard:', error);
      // Show error feedback
      button.classList.add('error');
      setTimeout(() => {
        button.classList.remove('error');
      }, 1000);
    }
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
    console.log('[Smart YouTube Chat] checkApiKey called');
    try {
      console.log('[Smart YouTube Chat] Sending checkApiKey message to background...');
      const response = await chrome.runtime.sendMessage({ action: 'checkApiKey' });
      console.log('[Smart YouTube Chat] checkApiKey response:', response);
      return response && response.success && response.hasApiKey;
    } catch (error) {
      console.error('[Smart YouTube Chat] Error checking API key:', error);
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
    
    // Ensure UI is ready for new input
    this.resetUIState();
  }

  getChannelName() {
    // Try multiple selectors for channel name
    const selectors = [
      '#channel-name #text',
      '#owner #channel-name yt-formatted-string',
      'ytd-video-owner-renderer #channel-name a',
      '.ytd-video-owner-renderer #text.ytd-channel-name',
      'yt-formatted-string#owner-name',
      '#upload-info #channel-name .yt-simple-endpoint',
      '#owner-container yt-formatted-string.ytd-channel-name',
      'ytd-channel-name yt-formatted-string',
      '#meta #channel-name'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        const channelName = element.textContent.trim();
        if (channelName) {
          console.log(`[YouTube Chat] Found channel name: "${channelName}" using selector: ${selector}`);
          return channelName;
        }
      }
    }
    
    console.log('[YouTube Chat] Could not find channel name with any selector');
    return 'Unknown Channel';
  }

  async autoSaveChat() {
    if (!this.currentVideoId || this.conversationHistory.length === 0) {
      console.log('[YouTube Chat] Not saving - videoId:', this.currentVideoId, 'history length:', this.conversationHistory.length);
      return;
    }
    
    const videoTitle = document.querySelector('h1.ytd-video-primary-info-renderer')?.textContent || 
                      document.querySelector('#title h1')?.textContent || 
                      'Unknown video';
    
    const channelName = this.getChannelName();
    
    console.log('[YouTube Chat] Auto-saving chat for video:', this.currentVideoId, 'with', this.conversationHistory.length, 'messages');
    
    await chrome.runtime.sendMessage({
      action: 'saveChat',
      videoId: this.currentVideoId,
      chatData: {
        videoId: this.currentVideoId,
        title: videoTitle,
        channelName: channelName,
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
    
    // Ensure UI is ready for new input
    this.resetUIState();
    
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
    if (!panel) return;
    
    // Prevent multiple rapid toggles
    if (this.isTogglingHistory) {
      console.log('[YouTube Chat] Already toggling history, skipping');
      return;
    }
    this.isTogglingHistory = true;
    
    const isVisible = panel.classList.contains('visible');
    
    console.log('[YouTube Chat] Toggling history panel, currently visible:', isVisible);
    
    if (!isVisible) {
      // Load and display chat history
      await this.loadChatHistory();
      
      // Re-attach search listener after panel is shown
      setTimeout(() => {
        const searchInput = this.chatUI.querySelector('.history-search-input');
        console.log('[YouTube Chat] Re-attaching search listener to:', searchInput);
        if (searchInput && !searchInput.hasAttribute('data-listener-attached')) {
          searchInput.addEventListener('input', (e) => {
            console.log('[YouTube Chat] History search input:', e.target.value);
            this.filterHistory(e.target.value);
          });
          searchInput.setAttribute('data-listener-attached', 'true');
        }
      }, 100);
    }
    
    panel.classList.toggle('visible');
    
    // Reset flag after a short delay
    setTimeout(() => {
      this.isTogglingHistory = false;
    }, 300);
  }
  
  async loadChatHistory() {
    try {
      console.log('[YouTube Chat] Loading chat history...');
      const response = await chrome.runtime.sendMessage({ action: 'getAllChats' });
      console.log('[YouTube Chat] Chat history response:', response);
      
      if (response.success && response.chats) {
        this.allChats = response.chats; // Store for filtering
        console.log('[YouTube Chat] Loaded chats:', this.allChats.length);
        this.displayChatHistory(response.chats);
      } else {
        console.error('[YouTube Chat] Failed to load chats:', response);
      }
    } catch (error) {
      console.error('[YouTube Chat] Error loading chat history:', error);
      // Show error in UI
      const historyList = this.chatUI.querySelector('.history-list');
      if (historyList) {
        historyList.innerHTML = `
          <div class="history-empty">
            <p>Error loading chat history</p>
            <p class="history-hint">${error.message}</p>
          </div>
        `;
      }
    }
  }
  
  displayChatHistory(chats) {
    const historyList = this.chatUI.querySelector('.history-list');
    
    console.log('[YouTube Chat] Displaying chat history:', chats.length, 'chats');
    console.log('[YouTube Chat] Sample chat data:', chats[0]);
    
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
          ${chat.channelName ? `<div class="history-item-channel">${chat.channelName}</div>` : ''}
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
    console.log('[YouTube Chat] Filtering history with term:', searchTerm);
    console.log('[YouTube Chat] All chats available:', this.allChats?.length);
    
    if (!this.allChats || this.allChats.length === 0) {
      console.log('[YouTube Chat] No chats to filter');
      return;
    }
    
    const filtered = searchTerm.trim() === '' 
      ? this.allChats 
      : this.allChats.filter(chat => {
          const searchLower = searchTerm.toLowerCase();
          const titleMatch = (chat.title || '').toLowerCase().includes(searchLower);
          const channelMatch = (chat.channelName || '').toLowerCase().includes(searchLower);
          const messageMatch = chat.messages?.some(msg => 
            msg.content.toLowerCase().includes(searchLower)
          );
          
          const matches = titleMatch || channelMatch || messageMatch;
          if (matches) {
            console.log('[YouTube Chat] Match found in chat:', chat.title, { titleMatch, channelMatch, messageMatch });
          }
          
          return matches;
        });
    
    console.log('[YouTube Chat] Filtered results:', filtered.length);
    this.displayChatHistory(filtered);
  }

  handleUrlChange() {
    console.log('[Smart] Handling URL change to:', location.href);
    if (window.location.pathname.includes('/watch')) {
      console.log('[Smart] Navigated to watch page, detecting video');
      debounce(() => this.detectVideo(), 500)();
    } else {
      console.log('[Smart] Not on watch page, hiding chat if visible');
      if (this.currentVideoId) {
        this.hideChat();
        this.currentVideoId = null;
        this.videoDuration = null;
      }
    }
  }

  initializeObservers() {
    // Watch for URL changes using multiple methods
    let lastUrl = location.href;
    const self = this;  // Store reference to this
    
    // Method 1: Override pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
      originalPushState.apply(history, arguments);
      console.log('[Smart] URL changed via pushState');
      setTimeout(() => {
        if (location.href !== lastUrl) {
          lastUrl = location.href;
          self.handleUrlChange();
        }
      }, 100);
    };
    
    history.replaceState = function() {
      originalReplaceState.apply(history, arguments);
      console.log('[Smart] URL changed via replaceState');
      setTimeout(() => {
        if (location.href !== lastUrl) {
          lastUrl = location.href;
          self.handleUrlChange();
        }
      }, 100);
    };
    
    // Method 2: Listen for popstate
    window.addEventListener('popstate', () => {
      console.log('[Smart] URL changed via popstate');
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        self.handleUrlChange();
      }
    });
    
    // Method 3: Mutation observer as fallback
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        console.log('[Smart] URL changed via DOM mutation');
        self.handleUrlChange();
      }
    }).observe(document, { subtree: true, childList: true });
    
    // Watch for fullscreen changes
    document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
    
    // Watch for YouTube-specific fullscreen changes
    const observer = new MutationObserver(() => {
      this.handleFullscreenChange();
    });
    
    // Observe changes to the movie player
    const checkPlayer = setInterval(() => {
      const player = document.querySelector('#movie_player');
      if (player) {
        observer.observe(player, {
          attributes: true,
          attributeFilter: ['class']
        });
        clearInterval(checkPlayer);
      }
    }, 1000);
    
    // Initial detection
    setTimeout(() => this.detectVideo(), 1000);
  }

  handleFullscreenChange() {
    // Check both native fullscreen and YouTube's theater mode
    const isFullscreen = !!(
      document.fullscreenElement || 
      document.webkitFullscreenElement ||
      document.querySelector('.ytp-fullscreen-button.ytp-button[aria-label*="Exit"]') ||
      document.querySelector('#movie_player.ytp-fullscreen')
    );
    
    if (isFullscreen && !this.isInFullscreen) {
      // Entering fullscreen
      this.isInFullscreen = true;
      if (this.chatUI) {
        this.wasVisibleBeforeFullscreen = this.chatUI.classList.contains('visible');
        this.wasMinimizedBeforeFullscreen = this.chatUI.classList.contains('minimized');
        this.wasMaximizedBeforeFullscreen = this.isMaximized;
        
        // Exit maximized mode if active
        if (this.isMaximized) {
          this.toggleMaximize();
        }
        
        // Hide the chat
        this.hideChat();
        console.log('[YouTube Chat] Hiding chat for fullscreen mode');
      }
    } else if (!isFullscreen && this.isInFullscreen) {
      // Exiting fullscreen
      this.isInFullscreen = false;
      if (this.wasVisibleBeforeFullscreen && this.chatUI) {
        this.showChat();
        if (!this.wasMinimizedBeforeFullscreen) {
          this.chatUI.classList.remove('minimized');
        }
        console.log('[YouTube Chat] Restoring chat after fullscreen exit');
      }
    }
  }

  addRepurposeButtonAfterMessage(messageEl, content) {
    // Create a separate container for the button that goes AFTER the message
    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'repurpose-wrapper';
    
    const button = document.createElement('button');
    button.className = 'repurpose-button';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      <span>Repurpose for LinkedIn</span>
    `;
    
    button.addEventListener('click', () => {
      this.handleRepurposeClick(content);
    });
    
    buttonWrapper.appendChild(button);
    
    // Insert the button wrapper AFTER the message element
    messageEl.insertAdjacentElement('afterend', buttonWrapper);
  }

  async handleRepurposeClick(content) {
    try {
      // Dynamically import the repurpose UI modules
      const baseUrl = chrome.runtime.getURL('');
      const [repurposeUIModule, transformerModule] = await Promise.all([
        import(`${baseUrl}content-repurposer/repurpose-ui.js`),
        import(`${baseUrl}content-repurposer/content-transformer.js`)
      ]);
      
      const { RepurposeUI } = repurposeUIModule;
      const { ContentTransformer } = transformerModule;
      
      // Create transformer and UI instances
      const transformer = new ContentTransformer();
      const repurposeUI = new RepurposeUI(transformer);
      
      // Set the content context with additional metadata
      repurposeUI.currentContent = content;
      repurposeUI.conversationHistory = this.conversationHistory;
      repurposeUI.videoId = this.currentVideoId;
      repurposeUI.videoTranscript = this.transcript;
      
      console.log('[YouTube Chat] Passing context to RepurposeUI:', {
        contentLength: content.length,
        historyLength: this.conversationHistory.length,
        hasTranscript: !!this.transcript
      });
      
      // Open the modal
      repurposeUI.openRepurposeModal();
      
    } catch (error) {
      console.error('[YouTube Chat] Error loading repurpose feature:', error);
      this.addMessage('system', 'Failed to load repurpose feature. Please try again.');
    }
  }
}

// Initialize smart extension
console.log('[Smart YouTube Chat] Creating extension instance...');
const smartExtension = new SmartYouTubeChatExtension();

// Wait for DOM and initialize
console.log('[Smart YouTube Chat] Document readyState:', document.readyState);
if (document.readyState === 'loading') {
  console.log('[Smart YouTube Chat] Waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[Smart YouTube Chat] DOMContentLoaded fired, initializing...');
    smartExtension.initialize();
  });
} else {
  console.log('[Smart YouTube Chat] DOM already loaded, initializing immediately...');
  // Small delay to ensure YouTube's elements are loaded
  setTimeout(() => {
    smartExtension.initialize();
  }, 100);
}

// Debug helper for testing
window.debugYouTubeChat = {
  getChannelName: () => smartExtension.getChannelName(),
  filterHistory: (term) => smartExtension.filterHistory(term),
  getAllChats: () => smartExtension.allChats,
  updateCurrentChatWithChannel: async () => {
    if (smartExtension.currentVideoId) {
      const channelName = smartExtension.getChannelName();
      console.log('[Debug] Updating current chat with channel:', channelName);
      await smartExtension.autoSaveChat();
      return channelName;
    }
    return 'No video loaded';
  }
};

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
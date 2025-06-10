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
    
    // Connection and state management
    this.isProcessingRequest = false;
    this.connectionStatus = 'connected';
    this.lastConnectionCheck = Date.now();
    this.retryAttempts = 0;
    this.maxRetryAttempts = 3;
    
    // Fullscreen tracking
    this.wasVisibleBeforeFullscreen = false;
    this.wasMinimizedBeforeFullscreen = false;
    this.isInFullscreen = false;
    
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
      
      // Show success message with smart routing info and video details
      messagesContainer.innerHTML = '';
      
      const durationMinutes = this.videoDuration ? Math.floor(this.videoDuration / 60) : 0;
      const durationSeconds = this.videoDuration ? this.videoDuration % 60 : 0;
      const durationStr = this.videoDuration ? 
        `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}` : 'unknown';
      
      let welcomeMessage = this.transcript 
        ? `Transcript loaded! I can now answer questions about this video.`
        : `I'm ready to help! (Note: Transcript not available for this video)`;
      
      welcomeMessage += `\n\n📺 **Video Duration**: ${durationStr}`;
      
      // Add timestamp availability info
      const validTimestamps = this.getValidTimestampsFromTranscript();
      if (validTimestamps.length > 0) {
        welcomeMessage += `\n⏱️ **Available Timestamps**: ${validTimestamps.length} precise time references`;
      } else {
        welcomeMessage += `\n⏱️ **Timestamps**: Smart validation enabled - invalid timestamps will be replaced with descriptive text`;
      }
      
      if (this.smartRoutingStrategy) {
        welcomeMessage += `\n\n🚀 Smart routing enabled: ${this.smartRoutingStrategy.strategy} strategy (${this.smartRoutingStrategy.expectedSavings} cost savings)`;
      }
      
      this.addMessage('assistant', welcomeMessage);
      
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
      this.addMessage('system', 'Error loading video data. Please refresh and try again.');
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
          <div class="connection-status connected" title="Connected to extension background"></div>
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
    // Simple markdown processing like the working archive version
    return content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h3>$1</h3>')
      .replace(/^# (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
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
    
    // Ensure UI is ready for new input
    this.resetUIState();
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
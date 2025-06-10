/**
 * Content Repurposing UI Component
 * Adds repurposing functionality to the YouTube chat interface
 */

export class RepurposeUI {
  constructor(contentTransformer) {
    this.transformer = contentTransformer;
    this.isOpen = false;
    this.currentPost = null;
    this.currentContent = null; // Content from the chat message
    this.generationAttempt = 0; // Track generation attempts for variation
  }

  /**
   * Add repurpose button to chat messages
   */
  addRepurposeButton(messageElement) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'repurpose-button-container';
    
    const button = document.createElement('button');
    button.className = 'repurpose-button';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 2L2 7L12 12L22 7L12 2Z"></path>
        <path d="M2 17L12 22L22 17"></path>
        <path d="M2 12L12 17L22 12"></path>
      </svg>
      <span>Repurpose</span>
    `;
    
    button.addEventListener('click', () => this.openRepurposeModal());
    
    buttonContainer.appendChild(button);
    messageElement.appendChild(buttonContainer);
  }

  /**
   * Create and show repurpose modal
   */
  openRepurposeModal() {
    if (this.isOpen) return;
    
    this.isOpen = true;
    this.generationAttempt = 0; // Reset generation counter for new modal
    const modal = this.createModal();
    document.body.appendChild(modal);
    
    // Animate in
    requestAnimationFrame(() => {
      modal.classList.add('repurpose-modal-visible');
    });
  }

  /**
   * Create modal structure
   */
  createModal() {
    const modal = document.createElement('div');
    modal.className = 'repurpose-modal';
    
    modal.innerHTML = `
      <div class="repurpose-modal-content">
        <div class="repurpose-header">
          <h3>Repurpose Video Content</h3>
          <button class="repurpose-close">×</button>
        </div>
        
        <div class="repurpose-body">
          <!-- Platform Selection -->
          <div class="platform-selection">
            <label>Choose Platform:</label>
            <div class="platform-buttons">
              <button class="platform-btn active" data-platform="linkedin">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
                LinkedIn
              </button>
              <button class="platform-btn" data-platform="twitter">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Twitter/X
              </button>
              <button class="platform-btn" data-platform="blog">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                Blog Post
              </button>
            </div>
          </div>

          <!-- Template Selection -->
          <div class="template-selection">
            <label>Content Style:</label>
            <select id="template-select">
              <option value="auto">Auto-detect best format</option>
              <option value="personalStory">Personal Story</option>
              <option value="numberList">Tips & List</option>
              <option value="problemAgitatesSolution">Problem → Solution</option>
              <option value="beforeAfterBridge">Transformation Story</option>
              <option value="contrarian">Contrarian Take</option>
            </select>
          </div>

          <!-- Tone Selection -->
          <div class="tone-selection">
            <label>Writing Tone:</label>
            <div class="tone-buttons">
              <button class="tone-btn active" data-tone="conversational">Conversational</button>
              <button class="tone-btn" data-tone="professional">Professional</button>
              <button class="tone-btn" data-tone="inspirational">Inspirational</button>
              <button class="tone-btn" data-tone="educational">Educational</button>
            </div>
          </div>

          <!-- Options -->
          <div class="repurpose-options">
            <label class="checkbox-label">
              <input type="checkbox" id="include-visual" checked>
              <span>Include visual suggestion</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="add-personal-touch" checked>
              <span>Add personal elements</span>
            </label>
          </div>

          <!-- Custom Prompt -->
          <div class="custom-prompt-section">
            <label>Additional Context (Optional):</label>
            <textarea id="custom-prompt" placeholder="Add any specific angle or personal experience you'd like to include..." rows="3"></textarea>
          </div>

          <!-- Generate Button -->
          <button class="generate-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2L20 8V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V4C4 2.9 4.9 2 6 2H14Z"></path>
              <path d="M14 2V8H20"></path>
              <path d="M12 18V12"></path>
              <path d="M9 15L12 12L15 15"></path>
            </svg>
            Generate Content
          </button>

          <!-- Loading State -->
          <div class="loading-state hidden">
            <div class="spinner"></div>
            <p>Transforming content...</p>
          </div>

          <!-- Results -->
          <div class="repurpose-results hidden">
            <div class="result-header">
              <h4>Your LinkedIn Post</h4>
              <div class="result-actions">
                <button class="copy-btn" title="Copy to clipboard">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                <button class="regenerate-btn" title="Generate another version">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 4V10H7"></path>
                    <path d="M23 20V14H17"></path>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="result-content" contenteditable="true"></div>
            
            <div class="visual-suggestion hidden">
              <h5>📸 Visual Suggestion:</h5>
              <p class="visual-text"></p>
            </div>
            
            <div class="result-metadata">
              <span class="word-count"></span>
              <span class="read-time"></span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    this.attachModalEvents(modal);
    
    return modal;
  }

  /**
   * Attach event listeners to modal
   */
  attachModalEvents(modal) {
    // Close button
    modal.querySelector('.repurpose-close').addEventListener('click', () => {
      this.closeModal(modal);
    });

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });

    // Platform buttons
    modal.querySelectorAll('.platform-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        modal.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Tone buttons
    modal.querySelectorAll('.tone-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        modal.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Generate button
    modal.querySelector('.generate-btn').addEventListener('click', () => {
      this.generateContent(modal);
    });

    // Copy button
    modal.querySelector('.copy-btn').addEventListener('click', () => {
      this.copyToClipboard(modal);
    });

    // Regenerate button
    modal.querySelector('.regenerate-btn').addEventListener('click', (e) => {
      console.log('[RepurposeUI] Regenerate button clicked');
      e.preventDefault();
      e.stopPropagation();
      
      // Add visual feedback
      const btn = e.currentTarget;
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<div class="mini-spinner"></div>';
      btn.disabled = true;
      
      // Generate content
      this.generateContent(modal).finally(() => {
        // Restore button after generation
        btn.innerHTML = originalHTML;
        btn.disabled = false;
      });
    });
  }

  /**
   * Generate repurposed content
   */
  async generateContent(modal) {
    // Increment generation attempt for variation
    this.generationAttempt++;
    
    console.log('[RepurposeUI] Starting generation attempt #' + this.generationAttempt);
    
    // Check if this is a regeneration (results already visible)
    const isRegeneration = !modal.querySelector('.repurpose-results').classList.contains('hidden');
    console.log('[RepurposeUI] Is regeneration:', isRegeneration);
    
    // Get selected options
    const platform = modal.querySelector('.platform-btn.active').dataset.platform;
    const template = modal.querySelector('#template-select').value;
    const tone = modal.querySelector('.tone-btn.active').dataset.tone;
    const includeVisual = modal.querySelector('#include-visual').checked;
    const customPrompt = modal.querySelector('#custom-prompt').value;

    console.log('[RepurposeUI] Generating content with options:', { platform, template, tone, includeVisual, attempt: this.generationAttempt });

    // Show loading state
    modal.querySelector('.loading-state').classList.remove('hidden');
    modal.querySelector('.generate-btn').classList.add('hidden');
    
    // Only hide results on first generation, not on regeneration
    if (!isRegeneration) {
      modal.querySelector('.repurpose-results').classList.add('hidden');
    }

    try {
      // Build comprehensive content context
      let contentContext = {
        mainContent: this.currentContent,
        conversationHistory: this.getConversationHistory(),
        videoTranscript: await this.getVideoTranscript()
      };
      
      // Create a structured prompt with all context
      let enrichedContent = `## Key Insight from YouTube Discussion\n\n${this.currentContent}`;
      
      // Add conversation context if available
      if (contentContext.conversationHistory && contentContext.conversationHistory.length > 0) {
        enrichedContent += `\n\n## Full Conversation Context:\n${contentContext.conversationHistory}`;
      }
      
      // Add custom prompt if provided
      if (customPrompt) {
        enrichedContent += `\n\n## Additional User Context:\n${customPrompt}`;
      }
      
      const metadata = this.getVideoMetadata();

      console.log('[RepurposeUI] Using enriched content with full context');
      console.log('[RepurposeUI] Content length:', enrichedContent.length);
      console.log('[RepurposeUI] Metadata:', metadata);
      console.log('[RepurposeUI] Video title found:', metadata.title);
      console.log('[RepurposeUI] Supporting points count:', contentContext.conversationHistory ? 'Has conversation' : 'No conversation');

      // Transform content with full context
      const result = await this.transformer.transformToLinkedIn(
        enrichedContent,
        metadata,
        {
          template,
          tone,
          includeVisual,
          targetLength: 'medium',
          generationAttempt: this.generationAttempt
        }
      );

      console.log('[RepurposeUI] Transformation result:', result);

      // Display results
      this.displayResults(modal, result);
      
    } catch (error) {
      console.error('[RepurposeUI] Error generating content:', error);
      this.showError(modal, 'Failed to generate content. Please try again.');
    }
  }

  /**
   * Display generated results
   */
  displayResults(modal, result) {
    // Hide loading
    modal.querySelector('.loading-state').classList.add('hidden');
    
    // Show generate button again (for regeneration with different settings)
    modal.querySelector('.generate-btn').classList.remove('hidden');
    
    // Show results
    const resultsSection = modal.querySelector('.repurpose-results');
    resultsSection.classList.remove('hidden');

    // Set content - use textContent to avoid HTML escaping issues
    const contentDiv = modal.querySelector('.result-content');
    // Simply set the text content - CSS white-space: pre-wrap will handle line breaks
    contentDiv.textContent = result.post;
    // Store the full content for copying
    this.currentPost = result.post;

    // Visual suggestion
    if (result.visualSuggestion) {
      const visualSection = modal.querySelector('.visual-suggestion');
      visualSection.classList.remove('hidden');
      visualSection.querySelector('.visual-text').textContent = result.visualSuggestion.suggestion;
    }

    // Metadata
    modal.querySelector('.word-count').textContent = `${result.metadata.wordCount} words`;
    modal.querySelector('.read-time').textContent = `~${result.metadata.estimatedReadTime} min read`;
  }

  /**
   * Copy content to clipboard
   */
  async copyToClipboard(modal) {
    const content = modal.querySelector('.result-content').textContent;
    
    try {
      await navigator.clipboard.writeText(content);
      
      // Show success feedback
      const copyBtn = modal.querySelector('.copy-btn');
      const originalHTML = copyBtn.innerHTML;
      copyBtn.innerHTML = '✓ Copied!';
      copyBtn.classList.add('success');
      
      setTimeout(() => {
        copyBtn.innerHTML = originalHTML;
        copyBtn.classList.remove('success');
      }, 2000);
      
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  /**
   * Close modal
   */
  closeModal(modal) {
    modal.classList.remove('repurpose-modal-visible');
    
    setTimeout(() => {
      modal.remove();
      this.isOpen = false;
    }, 300);
  }

  /**
   * Get video transcript
   */
  async getVideoTranscript() {
    try {
      // First, check if we have a transcript passed from the content script
      if (this.videoTranscript) {
        console.log('[RepurposeUI] Using passed video transcript');
        
        // Convert transcript to text if it's in segments format
        if (Array.isArray(this.videoTranscript?.segments)) {
          return this.videoTranscript.segments
            .map(seg => seg.text || seg)
            .join(' ');
        } else if (this.videoTranscript?.fullText) {
          return this.videoTranscript.fullText;
        } else if (typeof this.videoTranscript === 'string') {
          return this.videoTranscript;
        }
      }
      
      // Fallback to fetching from background script
      console.log('[RepurposeUI] Fetching transcript from background script');
      const response = await chrome.runtime.sendMessage({
        type: 'repurpose',
        action: 'fetchTranscript',
        data: {
          videoId: this.getVideoId()
        }
      });
      
      if (response.success) {
        return response.transcript;
      } else {
        throw new Error(response.error || 'Failed to fetch transcript');
      }
    } catch (error) {
      console.error('[RepurposeUI] Error getting transcript:', error);
      // Return empty string instead of throwing
      return '';
    }
  }
  
  /**
   * Get video ID from URL
   */
  getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v') || '';
  }

  /**
   * Get video metadata
   */
  getVideoMetadata() {
    // Extract from YouTube page - try multiple selectors for different layouts
    const titleElement = document.querySelector('h1.title.style-scope.ytd-video-primary-info-renderer') || 
                        document.querySelector('h1.title') ||
                        document.querySelector('#container h1') ||
                        document.querySelector('yt-formatted-string.style-scope.ytd-watch-metadata');
    
    const channelElement = document.querySelector('#channel-name yt-formatted-string') ||
                          document.querySelector('#channel-name') ||
                          document.querySelector('#owner #text') ||
                          document.querySelector('ytd-channel-name yt-formatted-string');
    
    return {
      title: titleElement?.textContent?.trim() || 'YouTube Video',
      channel: channelElement?.textContent?.trim() || 'Unknown Channel',
      duration: document.querySelector('.ytp-time-duration')?.textContent || '0:00'
    };
  }

  /**
   * Get conversation history from the chat
   */
  getConversationHistory() {
    try {
      // Use the conversation history passed from the content script
      if (this.conversationHistory && this.conversationHistory.length > 0) {
        const history = this.conversationHistory
          .slice(-6) // Get last 6 messages for context
          .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
          .join('\n\n');
        
        console.log('[RepurposeUI] Using passed conversation history, messages:', this.conversationHistory.length);
        return history;
      }
      
      // Fallback to DOM query if no history passed
      const messages = document.querySelectorAll('.youtube-chat-extension .message');
      const history = [];
      
      messages.forEach(msg => {
        const role = msg.classList.contains('user') ? 'User' : 'Assistant';
        const content = msg.querySelector('.content')?.textContent || '';
        if (content && content !== '...thinking...') {
          history.push(`${role}: ${content}`);
        }
      });
      
      console.log('[RepurposeUI] Using DOM-based history, messages:', history.length);
      return history.slice(-5).join('\n\n');
    } catch (error) {
      console.error('[RepurposeUI] Error getting conversation history:', error);
      return '';
    }
  }

  /**
   * Show error message
   */
  showError(modal, message) {
    const loadingState = modal.querySelector('.loading-state');
    loadingState.innerHTML = `<p class="error-message">${message}</p>`;
    
    setTimeout(() => {
      loadingState.classList.add('hidden');
      modal.querySelector('.generate-btn').classList.remove('hidden');
    }, 3000);
  }
}

// Add styles
const styles = `
.repurpose-button-container {
  margin-top: 8px;
}

.repurpose-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #0077b5;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.repurpose-button:hover {
  background: #005885;
  transform: translateY(-1px);
}

.repurpose-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  opacity: 0;
  transition: opacity 0.3s;
}

.repurpose-modal-visible {
  opacity: 1;
}

.repurpose-modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.repurpose-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e5e5;
}

.repurpose-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.repurpose-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #666;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
}

.repurpose-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.platform-selection,
.template-selection,
.tone-selection,
.repurpose-options {
  margin-bottom: 20px;
}

.platform-selection label,
.template-selection label,
.tone-selection label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.platform-buttons,
.tone-buttons {
  display: flex;
  gap: 8px;
}

.platform-btn,
.tone-btn {
  flex: 1;
  padding: 12px;
  border: 2px solid #e5e5e5;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.platform-btn.active,
.tone-btn.active {
  border-color: #0077b5;
  background: #f0f8ff;
  color: #0077b5;
}

#template-select {
  width: 100%;
  padding: 10px;
  border: 2px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  cursor: pointer;
}

.custom-prompt-section {
  margin-bottom: 20px;
}

.custom-prompt-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

#custom-prompt {
  width: 100%;
  padding: 10px;
  border: 2px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}

#custom-prompt:focus {
  outline: none;
  border-color: #0077b5;
}

.generate-btn {
  width: 100%;
  padding: 14px;
  background: #0077b5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.generate-btn:hover {
  background: #005885;
}

.loading-state {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e5e5;
  border-top-color: #0077b5;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.mini-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e5e5;
  border-top-color: #0077b5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

.repurpose-results {
  margin-top: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.result-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.result-actions {
  display: flex;
  gap: 8px;
}

.copy-btn,
.regenerate-btn {
  padding: 8px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover,
.regenerate-btn:hover:not(:disabled) {
  border-color: #0077b5;
  color: #0077b5;
}

.regenerate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.copy-btn.success {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.result-content {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  min-height: 200px;
  max-height: 300px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.visual-suggestion {
  margin-top: 16px;
  padding: 12px;
  background: #fef3c7;
  border-radius: 8px;
}

.visual-suggestion h5 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
}

.visual-text {
  margin: 0;
  font-size: 14px;
  color: #92400e;
}

.result-metadata {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  font-size: 12px;
  color: #666;
}

.hidden {
  display: none !important;
}

.error-message {
  color: #dc2626;
  font-weight: 500;
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
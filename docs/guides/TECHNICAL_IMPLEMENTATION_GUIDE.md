# Technical Implementation Guide - YouTube Chat Extension

## 🔄 Reusing Existing Components

### 1. Transcript Retrieval Adaptation

#### Current Python Implementation
```python
# From projects/youtube_educator/src/transcript_retriever.py
def extract_video_id(url: str) -> Optional[str]:
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:embed\/)([0-9A-Za-z_-]{11})',
        r'(?:watch\?v=)([0-9A-Za-z_-]{11})',
        r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})'
    ]
```

#### JavaScript Adaptation for Extension
```javascript
// lib/youtube-utils.js
export function extractVideoId(url) {
    const patterns = [
        /(?:v=|\/)([0-9A-Za-z_-]{11}).*/,
        /(?:embed\/)([0-9A-Za-z_-]{11})/,
        /(?:watch\?v=)([0-9A-Za-z_-]{11})/,
        /(?:youtu\.be\/)([0-9A-Za-z_-]{11})/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}
```

### 2. Transcript API Integration

Since `youtube-transcript-api` is Python-only, we'll use the YouTube Data API directly:

```javascript
// lib/transcript-fetcher.js
export class TranscriptFetcher {
    constructor() {
        this.API_BASE = 'https://www.youtube.com/api/timedtext';
    }
    
    async fetchTranscript(videoId, language = 'en') {
        try {
            // First, get available captions
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const response = await fetch(videoUrl);
            const html = await response.text();
            
            // Extract caption tracks from the page
            const captionRegex = /"captionTracks":(\[.*?\])/;
            const match = html.match(captionRegex);
            
            if (!match) throw new Error('No captions available');
            
            const tracks = JSON.parse(match[1]);
            const track = tracks.find(t => t.languageCode === language) || tracks[0];
            
            // Fetch the actual transcript
            const transcriptResponse = await fetch(track.baseUrl);
            const transcriptXml = await transcriptResponse.text();
            
            return this.parseTranscript(transcriptXml);
        } catch (error) {
            console.error('Transcript fetch error:', error);
            throw error;
        }
    }
    
    parseTranscript(xml) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');
        const texts = doc.querySelectorAll('text');
        
        return Array.from(texts).map(text => ({
            start: parseFloat(text.getAttribute('start')),
            duration: parseFloat(text.getAttribute('dur')),
            text: text.textContent.replace(/&amp;#39;/g, "'")
                                  .replace(/&amp;quot;/g, '"')
                                  .replace(/&amp;/g, '&')
        }));
    }
}
```

### 3. Gemini Client Adaptation

#### Converting Python Gemini Client to JavaScript

```javascript
// lib/gemini-client.js
export class GeminiClient {
    constructor(apiKey, modelName = 'models/gemini-2.5-flash-preview-05-20') {
        this.apiKey = apiKey;
        this.modelName = modelName;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.conversationHistory = [];
    }
    
    async generateContent(prompt, context = null) {
        const messages = this.buildMessages(prompt, context);
        
        try {
            const response = await fetch(
                `${this.baseUrl}/${this.modelName}:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: messages,
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 2048,
                        }
                    })
                }
            );
            
            const data = await response.json();
            if (data.candidates && data.candidates[0]) {
                const content = data.candidates[0].content.parts[0].text;
                this.conversationHistory.push(
                    { role: 'user', parts: [{ text: prompt }] },
                    { role: 'model', parts: [{ text: content }] }
                );
                return content;
            }
            throw new Error('No response from Gemini');
        } catch (error) {
            console.error('Gemini API error:', error);
            throw error;
        }
    }
    
    buildMessages(prompt, transcript) {
        const systemPrompt = `You are a helpful AI assistant for YouTube videos. 
        You have access to the video transcript and can answer questions about the content.
        Be concise but thorough in your responses.`;
        
        const messages = [
            {
                role: 'user',
                parts: [{
                    text: `${systemPrompt}\n\nVideo Transcript:\n${transcript}\n\nUser Question: ${prompt}`
                }]
            }
        ];
        
        // Add conversation history for context
        if (this.conversationHistory.length > 0) {
            // Include last 10 messages for context
            const recentHistory = this.conversationHistory.slice(-10);
            messages.unshift(...recentHistory);
        }
        
        return messages;
    }
    
    clearHistory() {
        this.conversationHistory = [];
    }
}
```

### 4. Chrome Storage Integration

```javascript
// lib/storage-manager.js
export class StorageManager {
    constructor() {
        this.storage = chrome.storage.local;
    }
    
    async saveVideoChat(videoId, videoData) {
        const key = `video_${videoId}`;
        await this.storage.set({ [key]: videoData });
    }
    
    async getVideoChat(videoId) {
        const key = `video_${videoId}`;
        const result = await this.storage.get(key);
        return result[key] || null;
    }
    
    async saveSettings(settings) {
        await this.storage.set({ settings });
    }
    
    async getSettings() {
        const result = await this.storage.get('settings');
        return result.settings || {
            apiKey: '',
            theme: 'auto',
            language: 'en'
        };
    }
    
    async clearVideoChat(videoId) {
        const key = `video_${videoId}`;
        await this.storage.remove(key);
    }
    
    async exportChat(videoId) {
        const chat = await this.getVideoChat(videoId);
        if (!chat) return null;
        
        const exportData = {
            videoId,
            title: chat.title,
            url: chat.url,
            exportDate: new Date().toISOString(),
            messages: chat.messages
        };
        
        return {
            json: JSON.stringify(exportData, null, 2),
            markdown: this.convertToMarkdown(exportData)
        };
    }
    
    convertToMarkdown(data) {
        let md = `# YouTube Chat Export\n\n`;
        md += `**Video**: ${data.title}\n`;
        md += `**URL**: ${data.url}\n`;
        md += `**Date**: ${data.exportDate}\n\n`;
        md += `## Conversation\n\n`;
        
        for (const msg of data.messages) {
            if (msg.role === 'user') {
                md += `**You**: ${msg.content}\n\n`;
            } else {
                md += `**AI**: ${msg.content}\n\n`;
            }
        }
        
        return md;
    }
}
```

### 5. Content Script for Video Detection

```javascript
// content/content-script.js
class YouTubeChatExtension {
    constructor() {
        this.currentVideoId = null;
        this.chatUI = null;
        this.transcriptFetcher = new TranscriptFetcher();
        this.storageManager = new StorageManager();
        this.geminiClient = null;
        this.transcript = null;
        
        this.init();
    }
    
    async init() {
        // Load settings and initialize Gemini client
        const settings = await this.storageManager.getSettings();
        if (settings.apiKey) {
            this.geminiClient = new GeminiClient(settings.apiKey);
        }
        
        // Watch for video changes
        this.observeVideoChanges();
        
        // Check if we're on a video page
        this.checkForVideo();
    }
    
    observeVideoChanges() {
        // For YouTube.com
        if (window.location.hostname === 'www.youtube.com') {
            // Watch for navigation changes (YouTube is a SPA)
            let lastUrl = location.href;
            new MutationObserver(() => {
                const url = location.href;
                if (url !== lastUrl) {
                    lastUrl = url;
                    this.checkForVideo();
                }
            }).observe(document, { subtree: true, childList: true });
        }
        
        // For embedded videos
        this.observeEmbeddedVideos();
    }
    
    observeEmbeddedVideos() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.tagName === 'IFRAME' && this.isYouTubeEmbed(node.src)) {
                        this.handleEmbeddedVideo(node);
                    }
                }
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Check existing iframes
        document.querySelectorAll('iframe').forEach(iframe => {
            if (this.isYouTubeEmbed(iframe.src)) {
                this.handleEmbeddedVideo(iframe);
            }
        });
    }
    
    isYouTubeEmbed(url) {
        return url && (
            url.includes('youtube.com/embed/') ||
            url.includes('youtube-nocookie.com/embed/')
        );
    }
    
    async checkForVideo() {
        const videoId = this.extractVideoIdFromPage();
        
        if (videoId && videoId !== this.currentVideoId) {
            this.currentVideoId = videoId;
            await this.loadVideoChat(videoId);
        } else if (!videoId && this.chatUI) {
            this.chatUI.hide();
        }
    }
    
    extractVideoIdFromPage() {
        // Try URL first
        const urlVideoId = extractVideoId(window.location.href);
        if (urlVideoId) return urlVideoId;
        
        // Try to find embedded video
        const iframe = document.querySelector('iframe[src*="youtube.com/embed/"]');
        if (iframe) {
            return extractVideoId(iframe.src);
        }
        
        return null;
    }
    
    async loadVideoChat(videoId) {
        // Show loading state
        if (!this.chatUI) {
            this.chatUI = new ChatUI();
        }
        this.chatUI.show();
        this.chatUI.setLoading(true);
        
        try {
            // Fetch transcript
            this.transcript = await this.transcriptFetcher.fetchTranscript(videoId);
            
            // Load existing chat history
            const savedChat = await this.storageManager.getVideoChat(videoId);
            if (savedChat) {
                this.chatUI.loadMessages(savedChat.messages);
                this.geminiClient.conversationHistory = savedChat.messages;
            }
            
            this.chatUI.setLoading(false);
            this.chatUI.onSendMessage = (message) => this.handleUserMessage(message);
            
        } catch (error) {
            this.chatUI.showError('Failed to load video transcript');
            console.error(error);
        }
    }
    
    async handleUserMessage(message) {
        if (!this.geminiClient) {
            this.chatUI.showError('Please set up your API key in extension settings');
            return;
        }
        
        // Add user message to UI
        this.chatUI.addMessage('user', message);
        
        // Show typing indicator
        this.chatUI.setTyping(true);
        
        try {
            // Get AI response
            const transcriptText = this.transcript.map(t => t.text).join(' ');
            const response = await this.geminiClient.generateContent(message, transcriptText);
            
            // Add AI response to UI
            this.chatUI.addMessage('assistant', response);
            
            // Save chat history
            await this.saveCurrentChat();
            
        } catch (error) {
            this.chatUI.showError('Failed to get AI response');
            console.error(error);
        } finally {
            this.chatUI.setTyping(false);
        }
    }
    
    async saveCurrentChat() {
        const messages = this.chatUI.getMessages();
        const videoData = {
            videoId: this.currentVideoId,
            title: document.title,
            url: window.location.href,
            messages: messages,
            lastAccessed: new Date().toISOString()
        };
        
        await this.storageManager.saveVideoChat(this.currentVideoId, videoData);
    }
}

// Initialize extension
new YouTubeChatExtension();
```

## 🎨 UI Components

### Chat Interface Design
```javascript
// content/chat-ui.js
export class ChatUI {
    constructor() {
        this.container = null;
        this.messagesContainer = null;
        this.inputField = null;
        this.isMinimized = false;
        this.messages = [];
        
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
                    <button class="chat-btn minimize">_</button>
                    <button class="chat-btn clear">Clear</button>
                    <button class="chat-btn export">Export</button>
                    <button class="chat-btn close">×</button>
                </div>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input-container">
                <input type="text" class="chat-input" placeholder="Ask about the video...">
                <button class="chat-send">Send</button>
            </div>
        `;
        
        // Add styles
        this.injectStyles();
        
        // Attach to page
        document.body.appendChild(this.container);
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .youtube-chat-extension {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 350px;
                height: 500px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                display: flex;
                flex-direction: column;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                z-index: 9999;
                transition: all 0.3s ease;
            }
            
            .youtube-chat-extension.minimized {
                height: 50px;
            }
            
            .chat-header {
                padding: 15px;
                background: #1a73e8;
                color: white;
                border-radius: 12px 12px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 15px;
                background: #f8f9fa;
            }
            
            .chat-message {
                margin-bottom: 12px;
                padding: 10px 15px;
                border-radius: 8px;
                max-width: 80%;
            }
            
            .chat-message.user {
                background: #1a73e8;
                color: white;
                margin-left: auto;
                text-align: right;
            }
            
            .chat-message.assistant {
                background: white;
                border: 1px solid #e0e0e0;
            }
            
            .chat-input-container {
                padding: 15px;
                border-top: 1px solid #e0e0e0;
                display: flex;
                gap: 10px;
            }
            
            .chat-input {
                flex: 1;
                padding: 10px;
                border: 1px solid #e0e0e0;
                border-radius: 20px;
                outline: none;
            }
            
            .chat-send {
                padding: 10px 20px;
                background: #1a73e8;
                color: white;
                border: none;
                border-radius: 20px;
                cursor: pointer;
            }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                .youtube-chat-extension {
                    background: #1e1e1e;
                    color: #e0e0e0;
                }
                
                .chat-messages {
                    background: #2a2a2a;
                }
                
                .chat-message.assistant {
                    background: #3a3a3a;
                    border-color: #4a4a4a;
                    color: #e0e0e0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}
```

## 🚀 Next Steps

1. **Set up development environment**
   ```bash
   mkdir youtube-chat-extension
   cd youtube-chat-extension
   npm init -y
   npm install --save-dev webpack webpack-cli
   ```

2. **Create manifest.json for Chrome Extension**
3. **Port Python components to JavaScript**
4. **Implement content script and UI**
5. **Test with various YouTube pages and embedded videos**
6. **Add error handling and edge cases**
7. **Optimize performance for long videos**

This implementation guide shows exactly how to leverage your existing codebase components while adapting them for a Chrome extension environment. The key is maintaining the core logic while adapting to browser constraints and APIs.
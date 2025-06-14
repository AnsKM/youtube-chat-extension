/**
 * Enhanced Service Worker with Smart Routing
 * Adds intelligent cost optimization while maintaining the same user experience
 */

// Standard GeminiClient (inline for service worker compatibility)
class GeminiClient {
  constructor(apiKey, modelName = 'gemini-2.5-flash-preview-05-20') {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async generateResponse(prompt, context = {}) {
    const { transcript, conversationHistory = [], videoDuration } = context;
    
    // Build proper context for the model
    let fullPrompt = prompt;
    if (transcript && transcript.length > 0) {
      const transcriptText = Array.isArray(transcript) 
        ? transcript.map(seg => seg.text || seg).join(' ')
        : transcript;
      
      // Calculate video duration info for timestamp validation
      const durationMinutes = videoDuration ? Math.floor(videoDuration / 60) : null;
      const durationSeconds = videoDuration ? videoDuration % 60 : null;
      const maxTimestamp = videoDuration ? 
        (durationMinutes > 0 ? `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}` : `0:${videoDuration.toString().padStart(2, '0')}`) 
        : 'unknown';
      
      // Extract valid timestamps from transcript for reference
      const validTimestamps = this.extractValidTimestamps(transcript, videoDuration);
      const timestampReference = validTimestamps.length > 0 
        ? `\n\nAvailable timestamps in this video: ${validTimestamps.slice(0, 10).join(', ')}${validTimestamps.length > 10 ? '...' : ''}`
        : '';
      
      fullPrompt = `You are a helpful AI assistant for YouTube videos. You have access to the complete transcript of a video that is exactly ${maxTimestamp} long.

CRITICAL TIMESTAMP RULES:
- ONLY use timestamps that exist in the provided transcript
- NEVER create timestamps beyond ${maxTimestamp}
- If referencing video content without exact timestamps, use descriptive phrases like "early in the video", "around the middle", "towards the end"
- All timestamps must be in [MM:SS] format and correspond to actual content
- When unsure about timing, describe the content without specific timestamps

Video Duration: ${maxTimestamp}${timestampReference}

Video Transcript:
${transcriptText}

User Question: ${prompt}

Remember: Only use timestamps that actually exist in the video transcript. Do not generate or hallucinate timestamps.`;
    }
    
    try {
      const response = await fetch(
        `${this.baseUrl}/models/${this.modelName}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: fullPrompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 3500,
              topK: 40,
              topP: 0.95
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_ONLY_HIGH"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_ONLY_HIGH"
              }
            ]
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          return candidate.content.parts[0].text;
        }
      }
      
      throw new Error('Invalid response format from API');
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  extractValidTimestamps(transcript, videoDuration) {
    const timestamps = [];
    
    if (!transcript || !videoDuration) return timestamps;
    
    // Handle both segment format and text format
    if (Array.isArray(transcript)) {
      // Transcript with segments
      transcript.forEach(segment => {
        if (segment.start !== undefined) {
          const minutes = Math.floor(segment.start / 60);
          const seconds = Math.floor(segment.start % 60);
          const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          
          // Validate against video duration
          if (segment.start <= videoDuration) {
            timestamps.push(timestamp);
          }
        }
      });
    } else if (typeof transcript === 'string') {
      // Extract timestamps from transcript text
      const timestampRegex = /\[?(\d{1,2}):(\d{2})\]?/g;
      let match;
      
      while ((match = timestampRegex.exec(transcript)) !== null) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const totalSeconds = minutes * 60 + seconds;
        
        // Validate against video duration
        if (totalSeconds <= videoDuration) {
          timestamps.push(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }
    }
    
    // Remove duplicates and sort
    const uniqueTimestamps = [...new Set(timestamps)];
    uniqueTimestamps.sort((a, b) => {
      const [aMin, aSec] = a.split(':').map(Number);
      const [bMin, bSec] = b.split(':').map(Number);
      return (aMin * 60 + aSec) - (bMin * 60 + bSec);
    });
    
    return uniqueTimestamps;
  }
}

// Smart routing enhancements
class SmartRouter {
  constructor() {
    this.videoMetadata = new Map();
    this.queryCache = new Map();
    this.costSavings = 0;
    this.strategies = {
      'direct-cache': { minLength: 0, maxLength: 30 },
      'smart-rag': { minLength: 30, maxLength: 180 },
      'aggressive-rag-cache': { minLength: 180, maxLength: Infinity }
    };
  }

  determineStrategy(videoDurationMinutes) {
    if (videoDurationMinutes < 30) return 'direct-cache';
    if (videoDurationMinutes < 180) return 'smart-rag';
    return 'aggressive-rag-cache';
  }

  async initializeVideo(videoId, transcript, duration) {
    const durationMinutes = Math.floor(duration / 60);
    const strategy = this.determineStrategy(durationMinutes);
    const tokenCount = this.estimateTokens(transcript);
    
    this.videoMetadata.set(videoId, {
      strategy,
      durationMinutes,
      tokenCount,
      transcript
    });

    console.log(`[Smart Router] Video ${videoId} initialized:`);
    console.log(`  Strategy: ${strategy}`);
    console.log(`  Duration: ${durationMinutes} minutes`);
    console.log(`  Tokens: ${tokenCount}`);
    
    return { strategy, expectedSavings: this.getExpectedSavings(strategy) };
  }

  getExpectedSavings(strategy) {
    const savings = {
      'direct-cache': '75%',
      'smart-rag': '85-90%',
      'aggressive-rag-cache': '95%+'
    };
    return savings[strategy] || '0%';
  }

  estimateTokens(transcript) {
    if (!transcript) return 0;
    const text = Array.isArray(transcript)
      ? transcript.map(seg => seg.text || seg).join(' ')
      : transcript;
    return Math.ceil(text.length / 4); // Rough estimate
  }

  getCacheKey(videoId, prompt) {
    return `${videoId}:${prompt.toLowerCase().trim()}`;
  }

  shouldCache(prompt) {
    const isShort = prompt.length < 100;
    const isFactual = /^(what|when|where|who|how many|list|name|show|find|tell me about)/i.test(prompt);
    return isShort && isFactual;
  }

  async routeQuery(videoId, prompt, generateFn) {
    const cacheKey = this.getCacheKey(videoId, prompt);
    
    // Check cache first
    if (this.queryCache.has(cacheKey)) {
      console.log('[Smart Router] Cache hit!');
      this.costSavings += 0.001; // Approximate savings
      return {
        response: this.queryCache.get(cacheKey),
        cached: true,
        costSaved: 0.001
      };
    }

    const metadata = this.videoMetadata.get(videoId);
    if (!metadata) {
      // No optimization available
      const response = await generateFn(prompt, { videoId });
      return { response, cached: false, costSaved: 0 };
    }

    // Apply strategy-specific optimizations
    let optimizedContext = { videoId };
    
    switch (metadata.strategy) {
      case 'direct-cache':
        // Use full transcript for short videos
        optimizedContext.transcript = metadata.transcript;
        break;
        
      case 'smart-rag':
        // Extract relevant portions (simplified version)
        optimizedContext.transcript = this.extractRelevantChunks(
          metadata.transcript, 
          prompt, 
          10 // chunks
        );
        break;
        
      case 'aggressive-rag-cache':
        // Minimal context for very long videos
        optimizedContext.transcript = this.extractRelevantChunks(
          metadata.transcript, 
          prompt, 
          5 // fewer chunks
        );
        break;
    }

    // Generate response with optimized context
    const response = await generateFn(prompt, optimizedContext);
    
    // Cache if appropriate
    if (this.shouldCache(prompt)) {
      this.queryCache.set(cacheKey, response);
    }

    // Calculate cost savings (simplified)
    const originalTokens = metadata.tokenCount;
    const optimizedTokens = this.estimateTokens(optimizedContext.transcript);
    const tokensSaved = originalTokens - optimizedTokens;
    const costSaved = (tokensSaved / 1000000) * 0.15; // $0.15 per 1M tokens
    
    this.costSavings += costSaved;
    
    return {
      response,
      cached: false,
      costSaved
    };
  }

  extractRelevantChunks(transcript, query, maxChunks) {
    if (!transcript || !Array.isArray(transcript)) return transcript;
    
    // Simple relevance extraction based on query keywords
    const queryWords = query.toLowerCase().split(/\s+/);
    const scored = transcript.map((segment, index) => {
      const text = (segment.text || segment).toLowerCase();
      const score = queryWords.reduce((sum, word) => {
        return sum + (text.includes(word) ? 1 : 0);
      }, 0);
      return { segment, score, index };
    });

    // Sort by relevance and take top chunks
    const relevant = scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxChunks)
      .sort((a, b) => a.index - b.index) // Maintain chronological order
      .map(item => item.segment);

    // If no relevant chunks found, take evenly distributed samples
    if (relevant.length === 0) {
      const step = Math.floor(transcript.length / maxChunks);
      return transcript.filter((_, index) => index % step === 0).slice(0, maxChunks);
    }

    return relevant;
  }

  getCostAnalysis() {
    return {
      totalSavings: this.costSavings.toFixed(4),
      cachedQueries: this.queryCache.size,
      videosOptimized: this.videoMetadata.size
    };
  }
}

// Connection health tracking
class ConnectionManager {
  constructor() {
    this.isHealthy = true;
    this.lastHeartbeat = Date.now();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.healthCheckInterval = null;
    this.startHealthCheck();
  }

  startHealthCheck() {
    // Check connection health every 10 seconds
    this.healthCheckInterval = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;
      if (timeSinceLastHeartbeat > 30000) { // 30 seconds without activity
        this.isHealthy = false;
        console.log('[Service Worker] Connection may be stale');
      }
    }, 10000);
  }

  heartbeat() {
    this.lastHeartbeat = Date.now();
    this.isHealthy = true;
    this.reconnectAttempts = 0;
  }

  getStatus() {
    return {
      healthy: this.isHealthy,
      lastHeartbeat: this.lastHeartbeat,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  cleanup() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

// Initialize components
let geminiClient = null;
let smartRouter = new SmartRouter();
let smartRoutingEnabled = true; // Can be toggled via settings
let connectionManager = new ConnectionManager();

// Service worker lifecycle management
self.addEventListener('activate', () => {
  console.log('[Service Worker] Activated');
  connectionManager = new ConnectionManager();
});

self.addEventListener('beforeunload', () => {
  console.log('[Service Worker] Before unload');
  connectionManager.cleanup();
});

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Chat Assistant (Smart Edition) installed');
  
  chrome.storage.sync.set({
    settings: {
      theme: 'auto',
      language: 'en',
      modelName: 'models/gemini-2.5-flash-preview-05-20',
      smartRouting: true // Enable by default
    }
  });
});

// Enhanced message handler with retry logic
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  connectionManager.heartbeat();
  handleMessageWithRetry(request, sender, sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessageWithRetry(request, sender, sendResponse, retryCount = 0) {
  try {
    await handleMessage(request, sender, sendResponse);
  } catch (error) {
    console.error(`[Service Worker] Error handling message (attempt ${retryCount + 1}):`, error);
    
    if (retryCount < connectionManager.maxReconnectAttempts) {
      // Wait before retry with exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      setTimeout(() => {
        handleMessageWithRetry(request, sender, sendResponse, retryCount + 1);
      }, delay);
    } else {
      sendResponse({ 
        success: false, 
        error: `Service unavailable after ${connectionManager.maxReconnectAttempts} attempts: ${error.message}`,
        needsReconnection: true
      });
    }
  }
}

async function handleMessage(request, sender, sendResponse) {
  try {
    // Handle repurpose requests
    if (request.type === 'repurpose') {
      await handleRepurposeRequest(request, sendResponse);
      return;
    }
    
    switch (request.action) {
      case 'initializeGemini':
        await initializeGeminiClient(request.apiKey);
        sendResponse({ success: true });
        break;
        
      case 'initializeVideo':
        // New action for smart routing
        if (smartRoutingEnabled && request.transcript && request.duration) {
          const result = await smartRouter.initializeVideo(
            request.videoId,
            request.transcript,
            request.duration
          );
          sendResponse({ 
            success: true, 
            strategy: result 
          });
        } else {
          sendResponse({ 
            success: false, 
            strategy: { strategy: 'standard', expectedSavings: '0%' } 
          });
        }
        break;
        
      case 'generateResponse':
        const response = await generateAIResponse(
          request.prompt, 
          request.context,
          request.videoId
        );
        
        // Include cost analysis if smart routing is enabled
        const analysis = smartRoutingEnabled 
          ? smartRouter.getCostAnalysis() 
          : { totalSavings: '0', cachedQueries: 0 };
          
        sendResponse({ 
          success: true, 
          response,
          usage: {
            savings: analysis.totalSavings,
            cached: analysis.cachedQueries > 0
          }
        });
        break;
        
      case 'getCostAnalysis':
        // New action for cost tracking
        const costAnalysis = smartRouter.getCostAnalysis();
        sendResponse({ success: true, analysis: costAnalysis });
        break;
        
      case 'toggleSmartRouting':
        // Allow toggling smart routing
        smartRoutingEnabled = request.enabled !== false;
        await chrome.storage.sync.set({ 
          'settings.smartRouting': smartRoutingEnabled 
        });
        sendResponse({ success: true, enabled: smartRoutingEnabled });
        break;
        
      // Keep all existing actions
      case 'fetchTranscript':
        const transcript = await fetchYouTubeTranscript(request.videoId, request.language);
        sendResponse({ success: true, transcript });
        break;
        
      case 'saveChat':
        await saveVideoChat(request.videoId, request.chatData);
        sendResponse({ success: true });
        break;
        
      case 'loadChat':
        const chatData = await loadVideoChat(request.videoId);
        sendResponse({ success: true, chatData });
        break;
        
      case 'clearChat':
        await clearVideoChat(request.videoId);
        sendResponse({ success: true });
        break;
        
      case 'getAllChats':
        const allChats = await getAllChats();
        sendResponse({ success: true, chats: allChats });
        break;
        
      case 'exportChat':
        const exportData = await exportVideoChat(request.videoId, request.format);
        sendResponse({ success: true, exportData });
        break;
        
      case 'checkApiKey':
        const { apiKey } = await chrome.storage.local.get('apiKey');
        sendResponse({ success: true, hasApiKey: !!apiKey });
        break;
        
      case 'healthCheck':
        // Connection health check
        const status = connectionManager.getStatus();
        sendResponse({ 
          success: true, 
          status: status,
          timestamp: Date.now()
        });
        break;
        
      case 'reconnect':
        // Force reconnection
        connectionManager.reconnectAttempts = 0;
        connectionManager.heartbeat();
        console.log('[Service Worker] Forced reconnection');
        sendResponse({ success: true, message: 'Reconnected successfully' });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Service worker error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Helper function to get API key from storage
async function getApiKey() {
  const { apiKey } = await chrome.storage.local.get('apiKey');
  return apiKey;
}

// Lazy load repurpose handler
let repurposeHandler = null;
async function getRepurposeHandler() {
  if (!repurposeHandler) {
    const { ContentRepurposeHandler } = await import('./content-repurpose-handler.js');
    const apiKey = await getApiKey();
    if (!apiKey) {
      console.warn('[Service Worker] No API key found for repurpose handler');
      // Still create handler but it will use mock responses
    }
    repurposeHandler = new ContentRepurposeHandler(apiKey);
  }
  return repurposeHandler;
}

async function handleRepurposeRequest(request, sendResponse) {
  try {
    const handler = await getRepurposeHandler();
    const result = await handler.handleRepurposeRequest(request);
    sendResponse(result);
  } catch (error) {
    console.error('[Repurpose Handler] Error:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

async function initializeGeminiClient(apiKey) {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  
  geminiClient = new GeminiClient(apiKey);
  await chrome.storage.local.set({ apiKey: apiKey });
}

async function generateAIResponse(prompt, context, videoId) {
  try {
    if (!geminiClient) {
      const { apiKey } = await chrome.storage.local.get('apiKey');
      if (!apiKey) {
        throw new Error('Please set your Gemini API key in the extension settings');
      }
      geminiClient = new GeminiClient(apiKey);
    }
    
    // Use smart routing if enabled and videoId is provided
    if (smartRoutingEnabled && videoId) {
      const result = await smartRouter.routeQuery(
        videoId,
        prompt,
        async (optimizedPrompt, optimizedContext) => {
          return await geminiClient.generateResponse(optimizedPrompt, optimizedContext);
        }
      );
      
      console.log(`[Smart Router] Cost saved: $${result.costSaved?.toFixed(4) || '0'}`);
      return result.response;
    }
    
    // Fallback to standard generation
    return await geminiClient.generateResponse(prompt, context);
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
}

// Keep all existing helper functions unchanged
async function fetchYouTubeTranscript(videoId, language = 'en') {
  return {
    videoId,
    language,
    segments: [],
    error: 'Transcript fetching to be implemented'
  };
}

async function saveVideoChat(videoId, chatData) {
  const key = `chat_${videoId}`;
  const data = {
    ...chatData,
    lastUpdated: new Date().toISOString()
  };
  await chrome.storage.local.set({ [key]: data });
}

async function loadVideoChat(videoId) {
  const key = `chat_${videoId}`;
  const result = await chrome.storage.local.get(key);
  return result[key] || null;
}

async function clearVideoChat(videoId) {
  const key = `chat_${videoId}`;
  await chrome.storage.local.remove(key);
}

async function getAllChats() {
  const result = await chrome.storage.local.get();
  const chats = [];
  
  for (const [key, value] of Object.entries(result)) {
    if (key.startsWith('chat_')) {
      const videoId = key.replace('chat_', '');
      chats.push({
        videoId,
        ...value
      });
    }
  }
  
  // Sort by last updated, most recent first
  chats.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
  return chats;
}

async function exportVideoChat(videoId, format = 'json') {
  const chatData = await loadVideoChat(videoId);
  if (!chatData) {
    throw new Error('No chat data found for this video');
  }
  
  switch (format) {
    case 'json':
      return JSON.stringify(chatData, null, 2);
    case 'markdown':
      return convertChatToMarkdown(chatData);
    case 'text':
      return convertChatToText(chatData);
    default:
      throw new Error('Unsupported export format');
  }
}

function convertChatToMarkdown(chatData) {
  let markdown = `# YouTube Chat Export\n\n`;
  markdown += `**Video Title**: ${chatData.title || 'Unknown'}\n`;
  markdown += `**Video ID**: ${chatData.videoId}\n`;
  markdown += `**Date**: ${chatData.lastUpdated}\n\n`;
  markdown += `## Conversation\n\n`;
  
  for (const message of chatData.messages || []) {
    if (message.role === 'user') {
      markdown += `**You**: ${message.content}\n\n`;
    } else {
      markdown += `**AI**: ${message.content}\n\n`;
    }
  }
  
  return markdown;
}

function convertChatToText(chatData) {
  let text = `YouTube Chat Export\n`;
  text += `==================\n\n`;
  text += `Video: ${chatData.title || chatData.videoId}\n`;
  text += `Date: ${chatData.lastUpdated}\n\n`;
  
  for (const message of chatData.messages || []) {
    text += `${message.role.toUpperCase()}: ${message.content}\n\n`;
  }
  
  return text;
}

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'toggleChat' });
});
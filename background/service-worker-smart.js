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
    const { transcript, conversationHistory = [] } = context;
    
    // Build proper context for the model
    let fullPrompt = prompt;
    if (transcript && transcript.length > 0) {
      const transcriptText = Array.isArray(transcript) 
        ? transcript.map(seg => seg.text || seg).join(' ')
        : transcript;
      
      fullPrompt = `You are an expert AI assistant for YouTube videos with advanced markdown formatting capabilities. You have access to the complete video transcript and must provide responses in properly formatted markdown that will be rendered in a chat interface.

## CRITICAL FORMATTING REQUIREMENTS:

### Response Structure Based on Query Type:

**For LIST queries** ("What are the X best...", "List the...", "Give me X examples"):
Use this exact format:
\`\`\`
1. Primary Title: Brief description here.

What it is: Detailed explanation of the concept.

Key points:
- Important detail one
- Important detail two
- Important detail three

2. Second Title: Brief description here.

What it is: Detailed explanation.
\`\`\`

**For PROCESS/HOW-TO queries** ("How to...", "What's the process...", "Steps to..."):
\`\`\`
## Step-by-Step Process

1. First Step (Phase 1): Description of what to do.

How to do it: Specific actionable instructions.

Why it matters: Brief explanation of importance.

2. Second Step (Phase 2): Description of next action.
\`\`\`

**For EXPLANATORY queries** ("What is...", "Explain...", "Tell me about..."):
\`\`\`
## Topic Overview

What it is: Clear definition or explanation.

How it works: Mechanism or process explanation.

Key benefits:
- Benefit one
- Benefit two
- Benefit three

Important considerations: Any caveats or additional info.
\`\`\`

**For COMPARISON queries** ("Difference between...", "Compare...", "X vs Y"):
\`\`\`
## Comparison Overview

### Option A: Name
What it is: Description
Pros: List advantages
Cons: List disadvantages

### Option B: Name  
What it is: Description
Pros: List advantages
Cons: List disadvantages

**Bottom line:** Clear recommendation or summary.
\`\`\`

**For SIMPLE FACT queries** (Short questions, specific facts):
Provide concise paragraph responses without complex formatting.

### Response Length Guidelines:
- **Short queries** (under 10 words): 50-150 words, minimal formatting
- **Medium queries** (10-20 words): 150-400 words, structured format
- **Complex queries** (20+ words): 400-800 words, full markdown structure
- **"Quick" or "brief" keywords**: Always under 200 words
- **"Detailed" or "comprehensive" keywords**: 500+ words with full structure

### Markdown Elements to Use:
- **Headers**: \`## Main Topic\` for primary sections, \`### Subsection\` for details
- **Numbered Lists**: \`1. Title: Description\` for sequential items
- **Bullet Points**: Use \`-\` for non-sequential lists
- **Bold Text**: \`**Important Point**\` for emphasis
- **Subheadings**: Use \`What it is:\`, \`How to do it:\`, \`Key points:\`, \`Why it matters:\`, \`Important note:\`
- **Blockquotes**: \`> Quote text\` for important quotes from the video
- **Code blocks**: Use \`\`\`language\` for any code or technical examples

### Content Intelligence:
- **Always reference specific parts** of the video when possible
- **Use speaker quotes** in blockquotes when relevant  
- **Adapt tone** to match query complexity (casual for simple, professional for detailed)
- **Include timestamps** when mentioning specific video moments
- **Cross-reference** related topics mentioned in the transcript

### CRITICAL: Selective Timestamp Integration
Only include timestamps when they add real value for navigation. Use this exact format:

**Format**: \`[MM:SS]\` or \`[H:MM:SS]\` for longer videos
**When to include timestamps**:
- When introducing a NEW major topic or concept
- When referencing a specific example or demonstration
- When quoting the speaker directly
- When pointing to a crucial moment or key insight

**When NOT to include timestamps**:
- Don't add timestamps to every line or sentence
- Skip timestamps for general statements or conclusions
- Avoid timestamps for your own explanations or summaries

**Good Examples**:
- "The speaker introduces the framework \`[3:15]\` and then demonstrates it with three examples."
- "As quoted \`[8:20]\`: 'This is the most important strategy.'"
- "The key turning point happens \`[12:45]\` when he explains the breakthrough."

**Bad Examples** (avoid these):
- "This is important \`[2:15]\` and you should \`[2:18]\` remember \`[2:22]\` this concept."
- Adding timestamps to your own analysis or transitions

**Integration Example**:
\`\`\`
1. The Framework Post: This involves packing knowledge into one post.

What it is: The speaker introduces this concept \`[3:15]\` as a way to create step-by-step processes that solve specific problems.

2. Educated Opinions: Share your professional insights based on experience.
\`\`\`

Video Transcript:
${transcriptText}

User Question: ${prompt}

IMPORTANT: 
1. Analyze the query type and determine appropriate response length
2. Format using the exact markdown patterns specified above
3. Include relevant timestamps throughout your response using [MM:SS] format
4. Your response will be rendered directly with clickable timestamps, so perfect syntax is critical.`;
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

// Initialize components
let geminiClient = null;
let smartRouter = new SmartRouter();
let smartRoutingEnabled = true; // Can be toggled via settings

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

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true;
});

async function handleMessage(request, sender, sendResponse) {
  try {
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
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Service worker error:', error);
    sendResponse({ success: false, error: error.message });
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
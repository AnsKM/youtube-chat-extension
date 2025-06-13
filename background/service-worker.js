/**
 * Service Worker for YouTube Chat Extension
 * Handles API calls and message passing between content scripts and popup
 */

// Since Chrome extensions don't support ES6 modules in service workers,
// we'll include the AI clients inline

// OpenRouter Client for DeepSeek R1 and other models
class OpenRouterClient {
  constructor(apiKey, modelName = 'deepseek/deepseek-r1-0528:free') {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  async generateResponse(prompt, context = {}) {
    try {
      // Build messages array with transcript context
      const messages = this.buildMessages(prompt, context);
      
      const response = await fetch(
        `${this.baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'chrome-extension://youtube-chat-assistant',
            'X-Title': 'YouTube Chat Assistant'
          },
          body: JSON.stringify({
            model: this.modelName,
            messages: messages,
            temperature: 0.7,
            max_tokens: 4096,
            top_p: 0.95
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        let content = data.choices[0].message.content;
        
        // Handle DeepSeek R1's special reasoning format
        if (this.modelName.includes('deepseek-r1')) {
          content = this.parseDeepSeekResponse(content);
        }
        
        return content;
      }
      
      throw new Error('No response generated');
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw error;
    }
  }

  parseDeepSeekResponse(content) {
    // DeepSeek R1 may include <think> tags for reasoning
    const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
    
    // Remove think tags to get the final response
    let finalResponse = content.replace(thinkRegex, '').trim();
    
    // If the entire response was in think tags, return the original content
    if (!finalResponse) {
      return content;
    }
    
    return finalResponse;
  }

  buildMessages(prompt, context) {
    const messages = [];
    
    // Add system message with transcript if available
    if (context.transcript) {
      const transcriptText = this.formatTranscript(context.transcript);
      if (transcriptText) {
        messages.push({
          role: 'system',
          content: `You are a helpful AI assistant for YouTube videos. You have access to the complete transcript of the video and can answer questions about its content. Be concise but thorough in your responses.

Video Transcript:
${transcriptText}

Important: You have access to the COMPLETE transcript. You can discuss any part of the video in detail.`
        });
      }
    }
    
    // Add conversation history if available
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      for (const msg of context.conversationHistory) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    }
    
    // Add current user prompt
    messages.push({
      role: 'user',
      content: prompt
    });
    
    return messages;
  }

  formatTranscript(transcript) {
    if (!transcript) return '';
    
    // Handle different transcript formats
    if (transcript.fullText) {
      return transcript.fullText;
    } else if (transcript.segments && Array.isArray(transcript.segments)) {
      return transcript.segments.map(seg => seg.text || seg).join(' ');
    } else if (typeof transcript === 'string') {
      return transcript;
    } else if (Array.isArray(transcript)) {
      return transcript.map(seg => seg.text || seg).join(' ');
    }
    
    return '';
  }
}

// Gemini Client
class GeminiClient {
  constructor(apiKey, modelName = 'gemini-2.5-flash-preview-05-20') {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async generateResponse(prompt, context = {}) {
    try {
      // Build enhanced prompt with transcript context
      const enhancedPrompt = this.buildEnhancedPrompt(prompt, context);
      
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
                text: enhancedPrompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 3500,  // Increased for structured responses with headings and formatting
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
      
      // More robust response parsing
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const content = candidate.content.parts[0].text;
          return content;
        }
      }
      
      // Log the unexpected response structure
      console.error('Unexpected API response structure:', data);
      throw new Error('Invalid response format from API');
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  buildEnhancedPrompt(prompt, context) {
    let enhancedPrompt = '';
    
    // Debug logging
    console.log('[GeminiClient] Building enhanced prompt with context:', {
      hasTranscript: !!context.transcript,
      transcriptKeys: context.transcript ? Object.keys(context.transcript) : [],
      hasFullText: !!(context.transcript?.fullText),
      hasSegments: !!(context.transcript?.segments)
    });
    
    // Add transcript context if available
    if (context.transcript) {
      const transcriptText = this.formatTranscript(context.transcript);
      console.log('[GeminiClient] Formatted transcript length:', transcriptText.length);
      
      if (transcriptText) {
        enhancedPrompt = `You are a helpful AI assistant for YouTube videos. You have access to the complete transcript of the video and can answer questions about its content. Be concise but thorough in your responses.

Video Transcript:
${transcriptText}

Important: You have access to the COMPLETE transcript thanks to Gemini's large context window. You can discuss any part of the video in detail.

`;
      }
    }
    
    // Add conversation history if available
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      enhancedPrompt += 'Previous conversation:\n';
      for (const msg of context.conversationHistory) {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        enhancedPrompt += `${role}: ${msg.content}\n\n`;
      }
      enhancedPrompt += '\n';
    }
    
    // Add the current prompt
    enhancedPrompt += `Current question: ${prompt}`;
    
    // If no transcript was available, just return the prompt
    if (!context.transcript) {
      return prompt;
    }
    
    return enhancedPrompt;
  }

  formatTranscript(transcript) {
    if (!transcript) return '';
    
    // Handle different transcript formats
    if (transcript.fullText) {
      return transcript.fullText;
    } else if (transcript.segments && Array.isArray(transcript.segments)) {
      return transcript.segments.map(seg => seg.text || seg).join(' ');
    } else if (typeof transcript === 'string') {
      return transcript;
    } else if (Array.isArray(transcript)) {
      return transcript.map(seg => seg.text || seg).join(' ');
    }
    
    return '';
  }
}

// Initialize AI clients
let geminiClient = null;
let openrouterClient = null;
let currentAIProvider = 'gemini';

// Initialize extension on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Chat Assistant installed');
  
  // Set default settings
  chrome.storage.sync.set({
    settings: {
      theme: 'auto',
      language: 'en',
      modelName: 'models/gemini-2.5-flash-preview-05-20'
    }
  });
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // Keep message channel open for async response
});

async function handleMessage(request, sender, sendResponse) {
  try {
    switch (request.action) {
      case 'initializeGemini':
        await initializeGeminiClient(request.apiKey);
        sendResponse({ success: true });
        break;
        
      case 'initializeAI':
        await initializeAIClient(request.apiKey, request.type, request.model);
        sendResponse({ success: true });
        break;
        
      case 'generateResponse':
        console.log('[Service Worker] Received generateResponse request:', {
          hasPrompt: !!request.prompt,
          promptLength: request.prompt?.length || 0,
          hasContext: !!request.context,
          contextKeys: request.context ? Object.keys(request.context) : [],
          hasTranscript: !!request.context?.transcript,
          transcriptType: request.context?.transcript ? typeof request.context.transcript : 'undefined'
        });
        const response = await generateAIResponse(request.prompt, request.context);
        sendResponse({ success: true, response });
        break;
        
      case 'fetchTranscript':
        const transcript = await fetchYouTubeTranscript(request.videoId, request.language);
        sendResponse({ success: true, transcript });
        break;
        
      case 'saveChat':
        await saveVideoChat(request.videoId, request.chatData);
        console.log('Chat saved for video:', request.videoId);
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
        
      case 'exportChat':
        const exportData = await exportVideoChat(request.videoId, request.format);
        sendResponse({ success: true, exportData });
        break;
        
      case 'checkApiKey':
        const { geminiApiKey, openrouterApiKey, selectedModel } = await chrome.storage.local.get(['geminiApiKey', 'openrouterApiKey', 'selectedModel']);
        const model = selectedModel || 'gemini';
        const hasApiKey = (model === 'gemini' && !!geminiApiKey) || (model === 'deepseek' && !!openrouterApiKey);
        sendResponse({ success: true, hasApiKey, selectedModel: model });
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

async function initializeAIClient(apiKey, type, model) {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  
  if (type === 'gemini') {
    geminiClient = new GeminiClient(apiKey, model);
    currentAIProvider = 'gemini';
    await chrome.storage.local.set({ geminiApiKey: apiKey, selectedModel: 'gemini' });
  } else if (type === 'openrouter') {
    openrouterClient = new OpenRouterClient(apiKey, model);
    currentAIProvider = 'deepseek';
    await chrome.storage.local.set({ openrouterApiKey: apiKey, selectedModel: 'deepseek' });
  }
}

async function generateAIResponse(prompt, context) {
  try {
    // Debug logging
    console.log('[Service Worker] Generating AI response with context:', {
      hasTranscript: !!context?.transcript,
      transcriptType: context?.transcript ? typeof context.transcript : 'none',
      transcriptKeys: context?.transcript ? Object.keys(context.transcript) : [],
      transcriptFullTextLength: context?.transcript?.fullText?.length || 0,
      transcriptSegmentsCount: context?.transcript?.segments?.length || 0,
      hasConversationHistory: !!context?.conversationHistory,
      historyLength: context?.conversationHistory?.length || 0,
      videoDuration: context?.videoDuration
    });
    
    // Load current model selection and API keys if clients not initialized
    const { selectedModel, geminiApiKey, openrouterApiKey } = await chrome.storage.local.get(['selectedModel', 'geminiApiKey', 'openrouterApiKey']);
    currentAIProvider = selectedModel || 'gemini';
    
    if (currentAIProvider === 'gemini') {
      if (!geminiClient) {
        if (!geminiApiKey) {
          throw new Error('Please set your Gemini API key in the extension settings');
        }
        geminiClient = new GeminiClient(geminiApiKey);
      }
      
      const response = await geminiClient.generateResponse(prompt, context);
      
      // Ensure response is valid
      if (!response || typeof response !== 'string') {
        console.error('Invalid response from Gemini:', response);
        throw new Error('Received invalid response from AI');
      }
      
      return response;
    } else if (currentAIProvider === 'deepseek') {
      if (!openrouterClient) {
        if (!openrouterApiKey) {
          throw new Error('Please set your OpenRouter API key in the extension settings');
        }
        openrouterClient = new OpenRouterClient(openrouterApiKey);
      }
      
      const response = await openrouterClient.generateResponse(prompt, context);
      
      // Ensure response is valid
      if (!response || typeof response !== 'string') {
        console.error('Invalid response from OpenRouter:', response);
        throw new Error('Received invalid response from AI');
      }
      
      return response;
    } else {
      throw new Error('Invalid AI provider selected');
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
}

async function fetchYouTubeTranscript(videoId, language = 'en') {
  // This will be implemented to fetch transcript from YouTube
  // For now, return a placeholder
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

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Send message to content script to toggle chat UI
  chrome.tabs.sendMessage(tab.id, { action: 'toggleChat' });
});
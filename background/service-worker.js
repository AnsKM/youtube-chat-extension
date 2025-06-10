/**
 * Service Worker for YouTube Chat Extension
 * Handles API calls and message passing between content scripts and popup
 */

// Since Chrome extensions don't support ES6 modules in service workers,
// we'll include the GeminiClient inline or load it differently
class GeminiClient {
  constructor(apiKey, modelName = 'gemini-2.5-flash-preview-05-20') {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async generateResponse(prompt, context = {}) {
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
                text: prompt
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
}

// Initialize Gemini client
let geminiClient = null;

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
        
      case 'generateResponse':
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

async function generateAIResponse(prompt, context) {
  try {
    if (!geminiClient) {
      // Try to load API key from storage
      const { apiKey } = await chrome.storage.local.get('apiKey');
      if (!apiKey) {
        throw new Error('Please set your Gemini API key in the extension settings');
      }
      geminiClient = new GeminiClient(apiKey);
    }
    
    const response = await geminiClient.generateResponse(prompt, context);
    
    // Ensure response is valid
    if (!response || typeof response !== 'string') {
      console.error('Invalid response from Gemini:', response);
      throw new Error('Received invalid response from AI');
    }
    
    return response;
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
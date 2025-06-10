/**
 * Content Repurpose Handler for Background Service Worker
 * Handles transcript fetching and AI transformation requests using Gemini
 */

import { ContentTransformer } from '../content-repurposer/content-transformer.js';

class ContentRepurposeHandler {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.transformer = new ContentTransformer();
    this.transcriptCache = new Map();
    
    if (!apiKey) {
      console.warn('[ContentRepurposeHandler] No API key provided - will use mock responses');
    }
  }

  /**
   * Handle repurpose requests from content script
   */
  async handleRepurposeRequest(request) {
    const { action, data } = request;

    switch (action) {
      case 'fetchTranscript':
        return await this.fetchTranscript(data.videoId);
      
      case 'transformContent':
        return await this.transformContent(data);
      
      case 'getVideoMetadata':
        return await this.getVideoMetadata(data.videoId);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Fetch transcript for video
   */
  async fetchTranscript(videoId) {
    // Check cache first
    if (this.transcriptCache.has(videoId)) {
      const cachedTranscript = this.transcriptCache.get(videoId);
      // Clean timestamps from cached transcript
      const cleanTranscript = this.cleanTimestamps(cachedTranscript);
      return { 
        success: true, 
        transcript: cleanTranscript 
      };
    }

    try {
      // Try multiple methods to get transcript
      let transcript = null;

      // Method 1: Try YouTube's built-in captions API (without timestamps for repurposing)
      transcript = await this.fetchFromYouTubeAPI(videoId, false);

      // Method 2: If that fails, try the external fetcher
      if (!transcript) {
        transcript = await this.fetchUsingExternalTool(videoId);
        // Clean timestamps from external tool if any
        if (transcript) {
          transcript = this.cleanTimestamps(transcript);
        }
      }

      if (transcript) {
        // Cache the clean transcript for future use
        this.transcriptCache.set(videoId, transcript);
        
        // Clear old cache entries if too many
        if (this.transcriptCache.size > 50) {
          const firstKey = this.transcriptCache.keys().next().value;
          this.transcriptCache.delete(firstKey);
        }

        return { success: true, transcript };
      }

      return { 
        success: false, 
        error: 'No transcript available for this video' 
      };

    } catch (error) {
      console.error('Error fetching transcript:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Clean timestamps from transcript text
   */
  cleanTimestamps(text) {
    // Remove [MM:SS] or [HH:MM:SS] timestamp patterns
    return text.replace(/\[\d{1,2}:\d{2}(:\d{2})?\]\s*/g, '').trim();
  }

  /**
   * Fetch transcript from YouTube API
   */
  async fetchFromYouTubeAPI(videoId, includeTimestamps = false) {
    try {
      // First get the caption tracks
      const videoResponse = await fetch(
        `https://www.youtube.com/watch?v=${videoId}`
      );
      const html = await videoResponse.text();
      
      // Extract caption tracks from the page
      const captionRegex = /"captionTracks":(\[.*?\])/;
      const match = html.match(captionRegex);
      
      if (!match) return null;
      
      const captionTracks = JSON.parse(match[1]);
      if (!captionTracks.length) return null;
      
      // Get the first available track (prefer English)
      const track = captionTracks.find(t => t.languageCode === 'en') || captionTracks[0];
      
      // Fetch the actual captions
      const captionResponse = await fetch(track.baseUrl);
      const captionXml = await captionResponse.text();
      
      // Parse XML to extract text
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(captionXml, 'text/xml');
      const textNodes = xmlDoc.getElementsByTagName('text');
      
      let transcript = '';
      for (const node of textNodes) {
        const text = node.textContent
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        
        if (includeTimestamps) {
          const start = parseFloat(node.getAttribute('start'));
          const timestamp = this.formatTimestamp(start);
          transcript += `[${timestamp}] ${text}\n`;
        } else {
          // For repurposing, just add the text with spaces
          transcript += text + ' ';
        }
      }
      
      return transcript.trim();
      
    } catch (error) {
      console.error('YouTube API method failed:', error);
      return null;
    }
  }

  /**
   * Fetch using external Python tool (via native messaging)
   */
  async fetchUsingExternalTool(videoId) {
    try {
      // This would use Chrome's native messaging to call the Python script
      // For now, we'll simulate it
      const response = await chrome.runtime.sendNativeMessage(
        'com.youtube.transcript_fetcher',
        { 
          action: 'fetch_transcript',
          videoId: videoId 
        }
      );
      
      return response.transcript;
      
    } catch (error) {
      console.error('External tool method failed:', error);
      return null;
    }
  }

  /**
   * Transform content using AI
   */
  async transformContent(data) {
    // Handle direct AI calls from the content transformer
    if (data.prompt) {
      console.log('[ContentRepurposeHandler] Handling prompt transformation request');
      console.log('[ContentRepurposeHandler] Prompt type:', data.prompt.includes('LinkedIn') ? 'LinkedIn post' : 'insights extraction');
      
      try {
        const result = await this.callGemini(data.prompt, data.options || {});
        console.log('[ContentRepurposeHandler] Transformation result preview:', result?.substring(0, 150));
        
        // Make sure we're returning actual content, not error messages
        if (result && result !== 'USE_MOCK_GENERATION') {
          return { 
            success: true, 
            result 
          };
        } else {
          console.log('[ContentRepurposeHandler] Returning mock trigger');
          return { 
            success: true, 
            result: 'USE_MOCK_GENERATION'
          };
        }
      } catch (error) {
        console.error('[ContentRepurposeHandler] Error calling Gemini:', error);
        return { 
          success: true,  // Return success with mock trigger
          result: 'USE_MOCK_GENERATION'
        };
      }
    }
    
    // Handle full transformation requests
    const { 
      transcript, 
      videoMetadata, 
      platform, 
      template, 
      tone, 
      includeVisual 
    } = data;

    try {
      // Override the transformer's callAI method to use our Gemini API key
      this.transformer.callAI = async (prompt, options = {}) => {
        return await this.callGemini(prompt, options);
      };

      // Transform the content
      const result = await this.transformer.transformToLinkedIn(
        transcript,
        videoMetadata,
        {
          template,
          tone,
          includeVisual,
          targetLength: 'medium'
        }
      );

      return { 
        success: true, 
        result 
      };

    } catch (error) {
      console.error('Error transforming content:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Call Gemini API
   */
  async callGemini(prompt, options = {}) {
    if (!this.apiKey) {
      console.warn('[ContentRepurposeHandler] No API key, returning mock response trigger');
      return 'USE_MOCK_GENERATION';
    }

    // Don't add the human style prompt here - it should already be included in the prompt from transformer
    const fullPrompt = prompt;

    console.log('[ContentRepurposeHandler] Calling Gemini API');
    console.log('[ContentRepurposeHandler] Prompt preview:', fullPrompt.substring(0, 300) + '...');
    console.log('[ContentRepurposeHandler] Prompt length:', fullPrompt.length);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${this.apiKey}`,
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
              temperature: options.temperature || 0.9,
              maxOutputTokens: options.max_tokens || 4000,
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
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_ONLY_HIGH"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_ONLY_HIGH"
              }
            ]
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('[ContentRepurposeHandler] Gemini API error:', error);
        throw new Error(error.error?.message || 'Gemini API request failed');
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const result = candidate.content.parts[0].text;
          console.log('[ContentRepurposeHandler] Gemini API success, response length:', result.length);
          console.log('[ContentRepurposeHandler] Response preview:', result.substring(0, 200) + '...');
          return result;
        }
      }
      
      throw new Error('Invalid response format from Gemini API');
    } catch (error) {
      console.error('[ContentRepurposeHandler] Error calling Gemini:', error);
      // Return trigger for mock generation instead of throwing
      return 'USE_MOCK_GENERATION';
    }
  }

  /**
   * Get video metadata
   */
  async getVideoMetadata(videoId) {
    try {
      // Fetch video page
      const response = await fetch(
        `https://www.youtube.com/watch?v=${videoId}`
      );
      const html = await response.text();
      
      // Extract metadata using regex
      const titleMatch = html.match(/"title":"([^"]+)"/);
      const channelMatch = html.match(/"author":"([^"]+)"/);
      const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
      
      const metadata = {
        title: titleMatch ? titleMatch[1] : 'Unknown Title',
        channel: channelMatch ? channelMatch[1] : 'Unknown Channel',
        duration: durationMatch ? this.formatDuration(parseInt(durationMatch[1])) : '0:00',
        videoId: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`
      };
      
      return { 
        success: true, 
        metadata 
      };
      
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Format timestamp from seconds
   */
  formatTimestamp(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format duration from seconds
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

// Export for use in service worker
export { ContentRepurposeHandler };
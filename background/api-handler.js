/**
 * Gemini API Handler
 * Manages communication with Google's Gemini 2.5 Flash Preview API
 */

export class GeminiClient {
  constructor(apiKey, modelName = 'models/gemini-2.5-flash-preview-05-20') {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.conversationHistory = [];
  }

  async generateResponse(prompt, context = {}) {
    const { transcript, conversationHistory = [] } = context;
    
    // Build the conversation context
    const messages = this.buildMessages(prompt, transcript, conversationHistory);
    
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
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_NONE'
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_NONE'
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_NONE'
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_NONE'
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
      
      if (data.candidates && data.candidates[0]) {
        const content = data.candidates[0].content.parts[0].text;
        return content;
      }
      
      throw new Error('No response generated');
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  buildMessages(prompt, transcript, conversationHistory) {
    const messages = [];
    
    // System context with transcript
    if (transcript && transcript.length > 0) {
      const transcriptText = this.formatTranscript(transcript);
      const systemMessage = {
        role: 'user',
        parts: [{
          text: `You are a helpful AI assistant for YouTube videos. You have access to the complete transcript of the video and can answer questions about its content. Be concise but thorough in your responses.

Video Transcript:
${transcriptText}

Important: You have access to the COMPLETE transcript thanks to Gemini 2.5's 1 million token context window. You can discuss any part of the video, no matter how long it is.`
        }]
      };
      messages.push(systemMessage);
      
      // Add a model acknowledgment
      messages.push({
        role: 'model',
        parts: [{
          text: 'I understand. I have access to the complete video transcript and can help you with any questions about its content.'
        }]
      });
    }
    
    // Add conversation history (last 10 messages for context)
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
    }
    
    // Add current user prompt
    messages.push({
      role: 'user',
      parts: [{ text: prompt }]
    });
    
    return messages;
  }

  formatTranscript(transcript) {
    if (Array.isArray(transcript)) {
      // If transcript is an array of segments
      return transcript
        .map(segment => {
          if (segment.text) {
            return segment.text;
          }
          return segment;
        })
        .join(' ');
    }
    // If transcript is already a string
    return transcript;
  }

  // Estimate token count (rough approximation)
  estimateTokenCount(text) {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  // Check if content fits within context window
  checkContextWindow(transcript, conversationHistory) {
    let totalTokens = 0;
    
    // Estimate transcript tokens
    if (transcript) {
      const transcriptText = this.formatTranscript(transcript);
      totalTokens += this.estimateTokenCount(transcriptText);
    }
    
    // Estimate conversation history tokens
    for (const msg of conversationHistory) {
      totalTokens += this.estimateTokenCount(msg.content);
    }
    
    // 1 million token context window for Gemini 2.5 Flash Preview
    const maxTokens = 1000000;
    const safetyMargin = 0.9; // Use 90% of max to be safe
    
    return {
      estimatedTokens: totalTokens,
      maxTokens: maxTokens,
      withinLimit: totalTokens < (maxTokens * safetyMargin),
      percentageUsed: (totalTokens / maxTokens) * 100
    };
  }
}
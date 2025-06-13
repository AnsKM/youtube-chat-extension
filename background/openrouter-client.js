/**
 * OpenRouter API Client
 * Manages communication with OpenRouter API for DeepSeek R1 and other models
 */

export class OpenRouterClient {
  constructor(apiKey, modelName = 'deepseek/deepseek-r1-0528:free') {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.conversationHistory = [];
  }

  async generateResponse(prompt, context = {}) {
    const { transcript, conversationHistory = [] } = context;
    
    // Build the conversation messages
    const messages = this.buildMessages(prompt, transcript, conversationHistory);
    
    try {
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
            top_p: 0.95,
            stream: false
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

  buildMessages(prompt, transcript, conversationHistory) {
    const messages = [];
    
    // System message with transcript context
    if (transcript && transcript.length > 0) {
      const transcriptText = this.formatTranscript(transcript);
      messages.push({
        role: 'system',
        content: `You are a helpful AI assistant for YouTube videos. You have access to the complete transcript of the video and can answer questions about its content. Be concise but thorough in your responses.

Video Transcript:
${transcriptText}

Important: You have access to the COMPLETE transcript. You can discuss any part of the video in detail.`
      });
    }
    
    // Add conversation history (last 10 messages for context)
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role,
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

  // Parse DeepSeek R1's response format which may include reasoning tags
  parseDeepSeekResponse(content) {
    // DeepSeek R1 may include <think> tags for reasoning
    // Extract the final answer outside of think tags
    const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
    
    // Remove think tags to get the final response
    let finalResponse = content.replace(thinkRegex, '').trim();
    
    // If the entire response was in think tags, return the original content
    if (!finalResponse) {
      return content;
    }
    
    return finalResponse;
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
    
    // DeepSeek R1 has a large context window
    const maxTokens = 64000; // Conservative estimate for DeepSeek R1
    const safetyMargin = 0.9; // Use 90% of max to be safe
    
    return {
      estimatedTokens: totalTokens,
      maxTokens: maxTokens,
      withinLimit: totalTokens < (maxTokens * safetyMargin),
      percentageUsed: (totalTokens / maxTokens) * 100
    };
  }
}
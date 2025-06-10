/**
 * Smart API Handler - Wrapper that adds intelligent routing to the existing GeminiClient
 * Provides cost optimization without changing the user experience
 */

import { GeminiClient } from './api-handler.js';

export class SmartGeminiClient extends GeminiClient {
  constructor(apiKey, modelName = 'models/gemini-2.5-flash-preview-05-20') {
    super(apiKey, modelName);
    this.smartRouterEnabled = true;
    this.videoStrategies = new Map(); // Cache strategies per video
    this.queryCache = new Map(); // Cache responses
    this.costSavings = 0;
    
    // Lazy load smart router to avoid initial overhead
    this.smartRouter = null;
  }

  /**
   * Initialize smart router for a video (called when video loads)
   */
  async initializeVideo(videoId, transcript, videoDuration) {
    try {
      // Lazy load the smart router
      if (!this.smartRouter && this.smartRouterEnabled) {
        const { SmartQueryRouter } = await import('../smart-router/smart-query-router.js');
        this.smartRouter = new SmartQueryRouter();
      }

      if (this.smartRouter) {
        await this.smartRouter.initialize(videoId, transcript, videoDuration);
        this.videoStrategies.set(videoId, this.smartRouter.strategy);
        
        return {
          success: true,
          strategy: {
            name: this.smartRouter.strategy,
            expectedSavings: this.smartRouter.getExpectedSavings()
          }
        };
      }
    } catch (error) {
      console.warn('Smart router initialization failed, falling back to standard mode:', error);
      this.smartRouterEnabled = false;
    }
    
    return { success: false, strategy: { name: 'standard', expectedSavings: '0%' } };
  }

  /**
   * Override generateResponse to add smart routing
   */
  async generateResponse(prompt, context = {}) {
    const { videoId, transcript, conversationHistory = [] } = context;
    
    // Check if we should use smart routing
    if (this.smartRouterEnabled && this.smartRouter && videoId) {
      try {
        // Check cache first
        const cacheKey = this.getCacheKey(videoId, prompt);
        if (this.queryCache.has(cacheKey)) {
          console.log('🎯 Cache hit! Returning cached response');
          const cachedResponse = this.queryCache.get(cacheKey);
          this.costSavings += this.estimateCost(prompt, transcript);
          return cachedResponse;
        }

        // Route through smart router
        const routedResponse = await this.smartRouter.route(prompt, {
          videoId,
          transcript,
          conversationHistory,
          apiKey: this.apiKey,
          generateFn: (optimizedPrompt, optimizedContext) => {
            // Use the parent class method with optimized context
            return super.generateResponse(optimizedPrompt, optimizedContext);
          }
        });

        // Cache the response if appropriate
        if (this.shouldCache(videoId, prompt)) {
          this.queryCache.set(cacheKey, routedResponse.response);
        }

        // Track cost savings
        if (routedResponse.costSaved) {
          this.costSavings += routedResponse.costSaved;
        }

        return routedResponse.response;
      } catch (error) {
        console.warn('Smart routing failed, falling back to standard mode:', error);
      }
    }
    
    // Fallback to standard mode
    return super.generateResponse(prompt, context);
  }

  /**
   * Get a unique cache key for a query
   */
  getCacheKey(videoId, prompt) {
    // Simple cache key - could be enhanced with better hashing
    return `${videoId}:${prompt.toLowerCase().trim()}`;
  }

  /**
   * Determine if a response should be cached
   */
  shouldCache(videoId, prompt) {
    // Cache short, factual queries
    const isShortQuery = prompt.length < 100;
    const isFactualQuery = /^(what|when|where|who|how many|list|name|show|find|tell me about)/i.test(prompt);
    return isShortQuery && isFactualQuery;
  }

  /**
   * Estimate the cost of a query (for tracking savings)
   */
  estimateCost(prompt, transcript) {
    const promptTokens = this.estimateTokenCount(prompt);
    const transcriptTokens = transcript ? this.estimateTokenCount(this.formatTranscript(transcript)) : 0;
    const totalTokens = promptTokens + transcriptTokens;
    
    // Gemini pricing (approximate)
    const costPer1kTokens = 0.00015; // $0.15 per 1M tokens
    return (totalTokens / 1000) * costPer1kTokens;
  }

  /**
   * Get cost analysis for the session
   */
  getCostAnalysis() {
    return {
      totalSavings: this.costSavings.toFixed(4),
      cachedQueries: this.queryCache.size,
      strategiesUsed: Array.from(this.videoStrategies.values()),
      smartRouterEnabled: this.smartRouterEnabled
    };
  }

  /**
   * Clear cache (useful for memory management)
   */
  clearCache() {
    this.queryCache.clear();
    this.videoStrategies.clear();
  }
}

/**
 * Static method to handle messages in service worker
 */
export async function handleSmartMessage(request, apiKey) {
  // Create or reuse client instance
  if (!globalThis.smartGeminiClient) {
    globalThis.smartGeminiClient = new SmartGeminiClient(apiKey);
  }
  
  const client = globalThis.smartGeminiClient;
  
  switch (request.action) {
    case 'initializeVideo':
      return await client.initializeVideo(
        request.videoId,
        request.transcript,
        request.duration
      );
      
    case 'generateResponse':
      const response = await client.generateResponse(
        request.prompt,
        request.context
      );
      
      // Include cost info if available
      const costAnalysis = client.getCostAnalysis();
      
      return {
        success: true,
        response: response,
        usage: {
          cost: 0, // Would need actual cost tracking
          savings: costAnalysis.totalSavings,
          cached: costAnalysis.cachedQueries > 0
        }
      };
      
    case 'getCostAnalysis':
      return {
        success: true,
        analysis: client.getCostAnalysis()
      };
      
    case 'clearCache':
      client.clearCache();
      return { success: true };
      
    default:
      throw new Error(`Unknown action: ${request.action}`);
  }
}
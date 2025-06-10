/**
 * Gemini Cache Manager - Handles context caching for Gemini 2.5 Flash Preview
 * Implements the caching API to reduce costs by 75% on repeated content
 */

export class GeminiCacheManager {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.modelName = 'models/gemini-2.5-flash-preview-05-20';
    
    // Cache configuration
    this.config = {
      defaultTTL: 3600,          // 1 hour default
      maxTTL: 86400,             // 24 hours max
      minTokensForCache: 1000,   // Minimum tokens to justify caching
      storageKey: 'gemini_cache_registry'
    };
    
    // In-memory cache registry (also persisted to chrome.storage)
    this.cacheRegistry = new Map();
    this.initializeRegistry();
  }

  /**
   * Initialize cache registry from storage
   */
  async initializeRegistry() {
    try {
      const stored = await chrome.storage.local.get(this.config.storageKey);
      if (stored[this.config.storageKey]) {
        const registry = stored[this.config.storageKey];
        Object.entries(registry).forEach(([key, value]) => {
          // Check if cache is still valid
          if (value.expiresAt > Date.now()) {
            this.cacheRegistry.set(key, value);
          }
        });
        
        // Clean up expired entries
        await this.cleanupExpiredCaches();
      }
    } catch (error) {
      console.error('Failed to initialize cache registry:', error);
    }
  }

  /**
   * Create a new cache
   */
  async createCache({ videoId, content, ttl = this.config.defaultTTL, metadata = {} }) {
    console.log('\n💾 CACHE CREATION REQUEST');
    console.log('-'.repeat(30));
    console.log(`Video ID: ${videoId}`);
    console.log(`TTL: ${ttl}s (${(ttl / 60).toFixed(1)} minutes)`);
    
    try {
      // Validate content size
      const tokenCount = this.estimateTokens(content);
      console.log(`Content size: ${tokenCount.toLocaleString()} tokens`);
      
      if (tokenCount < this.config.minTokensForCache) {
        console.log(`❌ Too small for caching (min: ${this.config.minTokensForCache} tokens)`);
        return null;
      }

      // Prepare cache request
      const cacheRequest = {
        model: this.modelName,
        contents: [{
          role: 'user',
          parts: [{
            text: content
          }]
        }],
        ttl: `${Math.min(ttl, this.config.maxTTL)}s`,
        displayName: `youtube_${videoId}_${Date.now()}`
      };

      // Add system instruction if provided
      if (metadata.systemInstruction) {
        cacheRequest.systemInstruction = {
          parts: [{
            text: metadata.systemInstruction
          }]
        };
      }

      // Create cache via API
      const response = await fetch(
        `${this.baseUrl}/cachedContents?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cacheRequest)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Cache creation failed: ${error.error?.message || 'Unknown error'}`);
      }

      const cacheData = await response.json();
      
      // Store in registry
      const cacheEntry = {
        cacheId: cacheData.name,
        videoId: videoId,
        createdAt: Date.now(),
        expiresAt: Date.now() + (ttl * 1000),
        tokenCount: tokenCount,
        metadata: metadata,
        usageCount: 0
      };
      
      this.cacheRegistry.set(videoId, cacheEntry);
      await this.persistRegistry();
      
      console.log(`✅ Cache created successfully!`);
      console.log(`Cache ID: ${cacheData.name}`);
      console.log(`Token count: ${tokenCount.toLocaleString()}`);
      console.log(`Cost per use: $${(tokenCount * 0.0375 / 1000000).toFixed(6)} (75% savings)`);
      console.log(`Storage cost: $${(tokenCount * 1.0 / 1000000 / 3600).toFixed(8)}/second`);
      console.log('-'.repeat(30));
      
      return cacheData.name;
    } catch (error) {
      console.error('❌ Cache creation failed:', error.message);
      console.log('-'.repeat(30));
      return null;
    }
  }

  /**
   * Get cache for a video/query
   */
  async getCache(videoId) {
    console.log(`\n🔍 Checking cache for: ${videoId}`);
    const entry = this.cacheRegistry.get(videoId);
    
    if (!entry) {
      console.log('  → No cache found');
      return null;
    }
    
    // Check if expired
    const now = Date.now();
    const remainingTime = entry.expiresAt - now;
    
    if (remainingTime <= 0) {
      console.log('  → Cache expired, removing...');
      this.cacheRegistry.delete(videoId);
      await this.persistRegistry();
      return null;
    }
    
    // Update usage count
    entry.usageCount++;
    entry.lastUsed = now;
    await this.persistRegistry();
    
    console.log(`  → Cache HIT! ✅`);
    console.log(`  → Usage #${entry.usageCount}`);
    console.log(`  → Expires in: ${(remainingTime / 1000 / 60).toFixed(1)} minutes`);
    console.log(`  → Saved: $${((entry.tokenCount * 0.15 - entry.tokenCount * 0.0375) / 1000000).toFixed(6)}`);
    
    return entry.cacheId;
  }

  /**
   * Update cache TTL
   */
  async updateCacheTTL(cacheId, newTTL) {
    try {
      const response = await fetch(
        `${this.baseUrl}/${cacheId}?key=${this.apiKey}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ttl: `${newTTL}s`
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update cache TTL');
      }

      // Update registry
      for (const [key, entry] of this.cacheRegistry.entries()) {
        if (entry.cacheId === cacheId) {
          entry.expiresAt = Date.now() + (newTTL * 1000);
          await this.persistRegistry();
          break;
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to update cache TTL:', error);
      return false;
    }
  }

  /**
   * Delete a cache
   */
  async deleteCache(cacheId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/${cacheId}?key=${this.apiKey}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete cache');
      }

      // Remove from registry
      let deletedKey = null;
      for (const [registryKey, entry] of this.cacheRegistry.entries()) {
        if (entry.cacheId === cacheId) {
          deletedKey = registryKey;
          this.cacheRegistry.delete(registryKey);
          await this.persistRegistry();
          break;
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to delete cache:', error);
      return false;
    }
  }

  /**
   * Generate content using cached context
   */
  async generateWithCache(cacheId, prompt, conversationHistory = []) {
    console.log('\n🚀 Generating with CACHED context');
    console.log(`Cache ID: ${cacheId}`);
    console.log(`Conversation history: ${conversationHistory.length} messages`);
    
    try {
      const requestBody = {
        cachedContent: cacheId,
        contents: [],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      };

      // Add conversation history
      if (conversationHistory.length > 0) {
        conversationHistory.forEach(msg => {
          requestBody.contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          });
        });
      }

      // Add current prompt
      requestBody.contents.push({
        role: 'user',
        parts: [{ text: prompt }]
      });

      const response = await fetch(
        `${this.baseUrl}/${this.modelName}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Generation failed');
      }

      const data = await response.json();
      
      // Extract usage metadata
      const usage = {
        cachedTokens: data.usageMetadata?.cachedContentTokenCount || 0,
        inputTokens: data.usageMetadata?.promptTokenCount || 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0
      };

      console.log('\n📈 Cache Usage Metrics:');
      console.log(`  • Cached tokens: ${usage.cachedTokens.toLocaleString()}`);
      console.log(`  • Fresh input tokens: ${usage.inputTokens.toLocaleString()}`);
      console.log(`  • Output tokens: ${usage.outputTokens.toLocaleString()}`);
      console.log(`  • Cache savings: $${((usage.cachedTokens * 0.15 - usage.cachedTokens * 0.0375) / 1000000).toFixed(6)}`);
      
      return {
        content: data.candidates[0].content.parts[0].text,
        usage: usage,
        cached: true
      };
    } catch (error) {
      console.error('❌ Cache generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Clean up expired caches
   */
  async cleanupExpiredCaches() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, entry] of this.cacheRegistry.entries()) {
      if (entry.expiresAt <= now) {
        expiredKeys.push(key);
        // Optionally delete from API
        await this.deleteCache(entry.cacheId).catch(err => 
          console.warn(`Failed to delete expired cache ${entry.cacheId}:`, err)
        );
      }
    }
    
    expiredKeys.forEach(key => this.cacheRegistry.delete(key));
    
    if (expiredKeys.length > 0) {
      await this.persistRegistry();
      console.log(`Cleaned up ${expiredKeys.length} expired caches`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const stats = {
      totalCaches: this.cacheRegistry.size,
      totalTokensCached: 0,
      totalUsage: 0,
      oldestCache: null,
      mostUsedCache: null,
      expiringCaches: [],
      estimatedMonthlySavings: 0
    };

    const now = Date.now();
    let oldestTime = Infinity;
    let maxUsage = 0;

    for (const [key, entry] of this.cacheRegistry.entries()) {
      stats.totalTokensCached += entry.tokenCount;
      stats.totalUsage += entry.usageCount;

      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        stats.oldestCache = key;
      }

      if (entry.usageCount > maxUsage) {
        maxUsage = entry.usageCount;
        stats.mostUsedCache = key;
      }

      // Check if expiring soon (within 10 minutes)
      if (entry.expiresAt - now < 600000) {
        stats.expiringCaches.push(key);
      }
    }

    // Calculate estimated savings
    // Cached tokens cost $0.0375 per 1M vs $0.15 per 1M (75% savings)
    const savingsPerMillion = 0.15 - 0.0375;
    stats.estimatedMonthlySavings = (stats.totalTokensCached / 1000000) * 
                                     savingsPerMillion * 
                                     stats.totalUsage * 
                                     30; // Assuming daily usage

    return stats;
  }

  /**
   * Persist registry to storage
   */
  async persistRegistry() {
    try {
      const registryObject = {};
      this.cacheRegistry.forEach((value, key) => {
        registryObject[key] = value;
      });
      
      await chrome.storage.local.set({
        [this.config.storageKey]: registryObject
      });
    } catch (error) {
      console.error('Failed to persist cache registry:', error);
    }
  }

  /**
   * Estimate token count
   */
  estimateTokens(text) {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if caching is worth it for given content
   */
  shouldCache(tokenCount, expectedUsage = 2) {
    // Calculate cost with and without caching
    const normalCost = (tokenCount / 1000000) * 0.15 * expectedUsage;
    const cachedCost = (tokenCount / 1000000) * 0.15 + // First use
                       (tokenCount / 1000000) * 0.0375 * (expectedUsage - 1) + // Subsequent uses
                       (tokenCount / 1000000) * 1.00 / 3600; // Storage cost per second
    
    return cachedCost < normalCost && tokenCount >= this.config.minTokensForCache;
  }

  /**
   * Get optimal TTL based on usage patterns
   */
  getOptimalTTL(videoLength, queryType) {
    // Longer videos likely to have more queries
    if (videoLength > 10800) { // > 3 hours
      return 7200; // 2 hours
    } else if (videoLength > 3600) { // > 1 hour
      return 3600; // 1 hour
    } else if (queryType === 'summary') {
      return 1800; // 30 minutes for summaries (likely to be reused)
    } else {
      return 900; // 15 minutes default
    }
  }
}
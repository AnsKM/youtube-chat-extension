/**
 * Smart Query Router - Intelligent cost optimization based on video length and query type
 * Automatically selects the best strategy: Direct, RAG, or Caching
 */

// Remove ES6 imports for Chrome extension compatibility
// These classes will be defined in the same file or loaded separately

class SmartQueryRouter {
  constructor() {
    this.simpleRAG = new SimpleRAG();
    this.enhancedRAG = null; // Lazy load for performance
    this.cacheManager = new GeminiCacheManager();
    this.classifier = new QueryClassifier();
    this.costTracker = new CostTracker();
    
    // Strategy thresholds (in minutes)
    this.thresholds = {
      direct: 30,        // < 30 min: Direct caching
      simpleRAG: 180,    // 30-180 min: Smart RAG
      aggressiveRAG: 180 // > 180 min: Aggressive RAG + caching
    };
    
    // Cache configuration
    this.cacheConfig = {
      ttl: 3600,              // 1 hour default
      maxCacheSize: 50000,    // Max tokens to cache
      minReuseCount: 2        // Min queries to justify caching
    };
  }

  /**
   * Initialize the router with video metadata
   */
  async initialize(videoId, transcript, videoDuration) {
    console.log('\n🚀 SMART QUERY ROUTER INITIALIZATION STARTED');
    console.log('='.repeat(50));
    
    this.videoId = videoId;
    this.transcript = transcript;
    this.videoDuration = videoDuration; // in seconds
    this.videoLengthMinutes = Math.floor(videoDuration / 60);
    
    // Calculate token count
    this.totalTokens = this.estimateTokens(transcript);
    
    console.log('📊 Video Analysis:');
    console.log(`  • Video ID: ${this.videoId}`);
    console.log(`  • Duration: ${this.videoLengthMinutes} minutes (${videoDuration} seconds)`);
    console.log(`  • Transcript segments: ${transcript.length}`);
    console.log(`  • Total tokens: ${this.totalTokens.toLocaleString()}`);
    console.log(`  • Estimated baseline cost: $${(this.totalTokens * 0.15 / 1000000).toFixed(4)}`);
    
    // Determine optimal strategy
    this.strategy = this.determineStrategy();
    
    console.log('\n🎯 Strategy Selection:');
    console.log(`  • Selected: ${this.strategy.toUpperCase()}`);
    console.log(`  • Reason: ${this.getStrategyReason()}`);
    console.log(`  • Expected cost reduction: ${this.getExpectedSavings()}`);
    
    // Pre-process based on strategy
    console.log('\n⚙️  Pre-processing transcript...');
    await this.preprocess();
    
    console.log('\n✅ Router initialization complete!');
    console.log('='.repeat(50));
  }

  /**
   * Determine the optimal strategy based on video length
   */
  determineStrategy() {
    if (this.videoLengthMinutes < this.thresholds.direct) {
      return 'direct-cache';
    } else if (this.videoLengthMinutes < this.thresholds.simpleRAG) {
      return 'smart-rag';
    } else {
      return 'aggressive-rag-cache';
    }
  }

  /**
   * Pre-process transcript based on strategy
   */
  async preprocess() {
    switch (this.strategy) {
      case 'direct-cache':
        // For short videos, prepare for direct caching
        console.log('  • Checking cache eligibility...');
        if (this.totalTokens < this.cacheConfig.maxCacheSize) {
          this.cacheReady = true;
          console.log(`  • ✅ Cache ready (${this.totalTokens} tokens < ${this.cacheConfig.maxCacheSize} limit)`);
        } else {
          console.log(`  • ⚠️  Too large for caching (${this.totalTokens} tokens)`);
        }
        break;
        
      case 'smart-rag':
        // Pre-chunk for RAG
        console.log('  • Creating RAG chunks...');
        this.chunks = this.simpleRAG.chunkTranscript(this.transcript);
        console.log(`  • ✅ Created ${this.chunks.length} chunks`);
        console.log(`  • Average chunk size: ${Math.floor(this.totalTokens / this.chunks.length)} tokens`);
        break;
        
      case 'aggressive-rag-cache':
        // Initialize enhanced RAG with embeddings
        console.log('  • Initializing Enhanced RAG system...');
        if (!this.enhancedRAG) {
          console.log('  • Loading Enhanced RAG module...');
          const { EnhancedRAG } = await import('./enhanced-rag.js');
          this.enhancedRAG = new EnhancedRAG();
          await this.enhancedRAG.initialize();
          console.log('  • Enhanced RAG initialized');
        }
        console.log('  • Indexing transcript with embeddings...');
        const startIndex = performance.now();
        await this.enhancedRAG.indexTranscript(this.videoId, this.transcript);
        console.log(`  • ✅ Indexing complete in ${(performance.now() - startIndex).toFixed(0)}ms`);
        break;
    }
  }

  /**
   * Route query to optimal handler
   */
  async processQuery(query, conversationHistory = []) {
    const startTime = performance.now();
    
    console.log('\n💬 PROCESSING NEW QUERY');
    console.log('='.repeat(40));
    console.log(`Query: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"`);
    console.log(`Conversation history: ${conversationHistory.length} messages`);
    
    // Classify the query
    const queryInfo = this.classifier.analyze(query);
    console.log('\n🔍 Query Classification:');
    console.log(`  • Type: ${queryInfo.type}`);
    console.log(`  • Confidence: ${(queryInfo.confidence * 100).toFixed(0)}%`);
    console.log(`  • Features: ${queryInfo.features.join(', ')}`);
    console.log(`  • Complexity: ${queryInfo.complexity}`);
    console.log(`  • Needs detail: ${queryInfo.needsDetail ? 'Yes' : 'No'}`);
    
    let result;
    let costInfo;
    
    console.log(`\n🚦 Routing via: ${this.strategy.toUpperCase()} strategy`);
    
    // Route based on strategy and query type
    switch (this.strategy) {
      case 'direct-cache':
        console.log('  → Using direct cache for fast response');
        result = await this.handleDirectCache(query, queryInfo, conversationHistory);
        break;
        
      case 'smart-rag':
        console.log('  → Using Smart RAG for intelligent chunk selection');
        result = await this.handleSmartRAG(query, queryInfo, conversationHistory);
        break;
        
      case 'aggressive-rag-cache':
        console.log('  → Using Aggressive RAG for maximum optimization');
        result = await this.handleAggressiveRAG(query, queryInfo, conversationHistory);
        break;
    }
    
    console.log('\n📊 Context Selection Results:');
    console.log(`  • Input tokens: ${result.inputTokens.toLocaleString()}`);
    console.log(`  • Cached: ${result.cached ? 'Yes ✅' : 'No ❌'}`);
    if (result.chunkCount) {
      console.log(`  • Chunks selected: ${result.chunkCount}`);
    }
    
    // Track performance and cost
    const processingTime = performance.now() - startTime;
    costInfo = await this.costTracker.track({
      strategy: this.strategy,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens || 2000, // estimate
      cached: result.cached,
      videoLength: this.videoLengthMinutes,
      processingTime
    });
    
    console.log('\n💰 Cost Analysis:');
    console.log(`  • Query cost: $${costInfo.cost.toFixed(6)}`);
    console.log(`  • Savings: $${costInfo.savings.toFixed(6)} (${costInfo.savingsPercent.toFixed(0)}%)`);
    console.log(`  • Processing time: ${processingTime.toFixed(0)}ms`);
    console.log('='.repeat(40));
    
    return {
      ...result,
      costInfo,
      strategy: this.strategy,
      processingTime
    };
  }

  /**
   * Handle short videos with direct caching
   */
  async handleDirectCache(query, queryInfo, conversationHistory) {
    console.log('\n  📦 Direct Cache Handler:');
    
    // Check if we have a cache
    let cacheId = await this.cacheManager.getCache(this.videoId);
    console.log(`    • Checking for existing cache: ${cacheId ? 'Found ✅' : 'Not found ❌'}`);
    
    if (!cacheId && this.cacheReady) {
      // Create cache on first query
      console.log('    • Creating new cache...');
      const cacheStart = performance.now();
      cacheId = await this.cacheManager.createCache({
        videoId: this.videoId,
        content: this.formatTranscriptForCache(this.transcript),
        ttl: this.cacheConfig.ttl
      });
      console.log(`    • Cache created in ${(performance.now() - cacheStart).toFixed(0)}ms`);
      console.log(`    • Cache ID: ${cacheId}`);
      console.log(`    • TTL: ${this.cacheConfig.ttl}s (${this.cacheConfig.ttl / 60} minutes)`);
    }
    
    // Build context
    const context = {
      query,
      transcript: !cacheId ? this.transcript : null,
      conversationHistory: this.trimConversationHistory(conversationHistory),
      cacheId
    };
    
    const inputTokens = this.estimateContextTokens(context);
    console.log(`    • Context size: ${inputTokens.toLocaleString()} tokens`);
    console.log(`    • Using ${cacheId ? 'cached' : 'fresh'} transcript`);
    
    return {
      context,
      inputTokens,
      cached: !!cacheId
    };
  }

  /**
   * Handle medium videos with smart RAG
   */
  async handleSmartRAG(query, queryInfo, conversationHistory) {
    console.log('\n  🎯 Smart RAG Handler:');
    
    // Use appropriate RAG based on query type
    let relevantChunks;
    let searchMethod;
    
    if (queryInfo.hasTimestamp) {
      // Get chunks around timestamp
      searchMethod = 'Timestamp-based search';
      console.log(`    • Method: ${searchMethod}`);
      console.log(`    • Target: ${queryInfo.hints.timestamp.formatted}`);
      relevantChunks = this.getTimestampChunks(queryInfo.hints.timestamp.totalSeconds, this.chunks);
    } else if (queryInfo.isSummary) {
      // Sample chunks across video
      searchMethod = 'Distributed sampling';
      console.log(`    • Method: ${searchMethod}`);
      console.log(`    • Sampling: Even distribution across video`);
      relevantChunks = this.getDistributedChunks(this.chunks, 8);
    } else {
      // Semantic search
      searchMethod = 'Semantic search';
      console.log(`    • Method: ${searchMethod}`);
      console.log(`    • Keywords: ${queryInfo.hints.keyTerms?.keywords.slice(0, 5).join(', ') || 'N/A'}`);
      relevantChunks = this.simpleRAG.findRelevantChunks(query, this.chunks);
    }
    
    console.log(`    • Found ${relevantChunks.length} relevant chunks`);
    
    // Limit chunks based on token budget
    const selectedChunks = this.selectChunksWithinBudget(relevantChunks, 4000);
    console.log(`    • Selected ${selectedChunks.length} chunks within token budget`);
    console.log(`    • Chunk indices: [${selectedChunks.map(c => c.index).join(', ')}]`);
    
    // Check if we should cache these chunks
    const shouldCache = await this.shouldCacheChunks(query, selectedChunks);
    console.log(`    • Cache decision: ${shouldCache ? 'Yes (will cache)' : 'No (one-time use)'}`);
    
    let cacheId = null;
    if (shouldCache) {
      console.log('    • Creating chunk cache...');
      cacheId = await this.cacheManager.createCache({
        videoId: `${this.videoId}_${queryInfo.type}`,
        content: this.formatChunksForCache(selectedChunks),
        ttl: 1800 // 30 minutes for chunk cache
      });
      console.log(`    • Chunk cache created with 30-minute TTL`);
    }
    
    const context = {
      query,
      chunks: !cacheId ? selectedChunks : null,
      conversationHistory: this.trimConversationHistory(conversationHistory, 6),
      cacheId
    };
    
    const inputTokens = this.estimateContextTokens(context);
    console.log(`    • Total context: ${inputTokens.toLocaleString()} tokens`);
    
    return {
      context,
      inputTokens,
      cached: !!cacheId,
      chunkCount: selectedChunks.length
    };
  }

  /**
   * Handle long videos with aggressive RAG and caching
   */
  async handleAggressiveRAG(query, queryInfo, conversationHistory) {
    console.log('\n  🚀 Aggressive RAG Handler:');
    console.log('    • Using enhanced RAG with embeddings');
    console.log(`    • Max chunks: ${queryInfo.needsDetail ? 8 : 5}`);
    console.log(`    • Strategy: ${queryInfo.type}`);
    
    // Use enhanced RAG with embeddings
    const ragStart = performance.now();
    const relevantChunks = await this.enhancedRAG.getRelevantContext(
      query, 
      this.videoId,
      {
        maxChunks: queryInfo.needsDetail ? 8 : 5,
        strategy: queryInfo.type
      }
    );
    console.log(`    • RAG search completed in ${(performance.now() - ragStart).toFixed(0)}ms`);
    console.log(`    • Found ${relevantChunks.length} relevant chunks`);
    
    // Very selective chunk selection for long videos
    const selectedChunks = this.selectChunksWithinBudget(relevantChunks, 3000);
    console.log(`    • Aggressively filtered to ${selectedChunks.length} chunks (3K token budget)`);
    
    if (selectedChunks.length > 0) {
      console.log(`    • Similarity scores: [${selectedChunks.slice(0, 5).map(c => c.similarity?.toFixed(2) || 'N/A').join(', ')}...]`);
    }
    
    // Always try to cache for long videos
    const cacheKey = `${this.videoId}_${this.hashQuery(query)}`;
    console.log('    • Checking query-specific cache...');
    let cacheId = await this.cacheManager.getCache(cacheKey);
    
    if (!cacheId && selectedChunks.length > 0) {
      console.log('    • Creating aggressive cache (2-hour TTL)...');
      cacheId = await this.cacheManager.createCache({
        videoId: cacheKey,
        content: this.formatChunksForCache(selectedChunks),
        ttl: 7200 // 2 hours for long video chunks
      });
      console.log(`    • Cache created for query hash: ${this.hashQuery(query)}`);
    } else if (cacheId) {
      console.log('    • Reusing existing cache ✅');
    }
    
    const context = {
      query,
      chunks: !cacheId ? selectedChunks : null,
      conversationHistory: this.trimConversationHistory(conversationHistory, 4),
      cacheId
    };
    
    const inputTokens = this.estimateContextTokens(context);
    console.log(`    • Final context: ${inputTokens.toLocaleString()} tokens`);
    console.log(`    • Reduction: ${((1 - inputTokens / this.totalTokens) * 100).toFixed(1)}% vs full transcript`);
    
    return {
      context,
      inputTokens,
      cached: !!cacheId,
      chunkCount: selectedChunks.length
    };
  }

  /**
   * Get chunks around a specific timestamp
   */
  getTimestampChunks(timestamp, chunks, windowSize = 120) {
    return chunks.filter(chunk => {
      const distance = Math.min(
        Math.abs(chunk.start - timestamp),
        Math.abs(chunk.end - timestamp)
      );
      return distance <= windowSize;
    }).sort((a, b) => {
      const aDist = Math.abs((a.start + a.end) / 2 - timestamp);
      const bDist = Math.abs((b.start + b.end) / 2 - timestamp);
      return aDist - bDist;
    });
  }

  /**
   * Get evenly distributed chunks across video
   */
  getDistributedChunks(chunks, count) {
    if (chunks.length <= count) return chunks;
    
    const step = Math.floor(chunks.length / count);
    const selected = [];
    
    for (let i = 0; i < count; i++) {
      const index = Math.min(i * step, chunks.length - 1);
      selected.push(chunks[index]);
    }
    
    return selected;
  }

  /**
   * Select chunks within token budget
   */
  selectChunksWithinBudget(chunks, maxTokens) {
    const selected = [];
    let currentTokens = 0;
    
    for (const chunk of chunks) {
      const chunkTokens = this.estimateTokens(chunk.text);
      if (currentTokens + chunkTokens > maxTokens) break;
      
      selected.push(chunk);
      currentTokens += chunkTokens;
    }
    
    return selected;
  }

  /**
   * Determine if chunks should be cached
   */
  async shouldCacheChunks(query, chunks) {
    // Cache if query seems like it will be repeated
    const queryFeatures = this.classifier.analyze(query);
    
    // Always cache summaries and overviews
    if (queryFeatures.isSummary) return true;
    
    // Cache if chunks are substantial
    const totalTokens = chunks.reduce((sum, chunk) => 
      sum + this.estimateTokens(chunk.text), 0
    );
    
    return totalTokens > 2000;
  }

  /**
   * Format transcript for caching
   */
  formatTranscriptForCache(transcript) {
    const text = transcript.map(seg => seg.text).join(' ');
    return `Video Transcript:\n\n${text}`;
  }

  /**
   * Format chunks for caching
   */
  formatChunksForCache(chunks) {
    let formatted = 'Relevant video segments:\n\n';
    
    chunks.forEach(chunk => {
      const timestamp = this.formatTimestamp(chunk.start);
      formatted += `[${timestamp}] ${chunk.text}\n\n`;
    });
    
    return formatted;
  }

  /**
   * Trim conversation history to fit token budget
   */
  trimConversationHistory(history, maxExchanges = 10) {
    return history.slice(-maxExchanges * 2); // Keep last N exchanges
  }

  /**
   * Estimate tokens for text
   */
  estimateTokens(text) {
    if (typeof text === 'string') {
      return Math.ceil(text.length / 4);
    }
    if (Array.isArray(text)) {
      return text.reduce((sum, item) => 
        sum + this.estimateTokens(item.text || item), 0
      );
    }
    return 0;
  }

  /**
   * Estimate tokens for context object
   */
  estimateContextTokens(context) {
    let tokens = 0;
    
    if (context.transcript) {
      tokens += this.estimateTokens(context.transcript);
    }
    
    if (context.chunks) {
      tokens += this.estimateTokens(context.chunks);
    }
    
    if (context.conversationHistory) {
      tokens += context.conversationHistory.reduce((sum, msg) => 
        sum + this.estimateTokens(msg.content), 0
      );
    }
    
    tokens += this.estimateTokens(context.query);
    tokens += 500; // System prompt estimate
    
    return tokens;
  }

  /**
   * Format timestamp
   */
  formatTimestamp(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Simple hash for query caching
   */
  hashQuery(query) {
    return query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .slice(0, 5)
      .join('_');
  }

  /**
   * Get strategy recommendation for UI
   */
  getStrategyInfo() {
    const strategies = {
      'direct-cache': {
        name: 'Direct Caching',
        description: 'Full transcript cached for fast responses',
        icon: '⚡',
        costPerQuery: '$0.001-0.002'
      },
      'smart-rag': {
        name: 'Smart RAG',
        description: 'Intelligent chunk selection for relevance',
        icon: '🎯',
        costPerQuery: '$0.002-0.005'
      },
      'aggressive-rag-cache': {
        name: 'Aggressive RAG + Cache',
        description: 'Maximum optimization for long videos',
        icon: '🚀',
        costPerQuery: '$0.001-0.003'
      }
    };
    
    return strategies[this.strategy];
  }
  
  /**
   * Get strategy selection reason
   */
  getStrategyReason() {
    if (this.strategy === 'direct-cache') {
      return `Video is short (${this.videoLengthMinutes} min < ${this.thresholds.direct} min threshold)`;
    } else if (this.strategy === 'smart-rag') {
      return `Video is medium length (${this.thresholds.direct} min < ${this.videoLengthMinutes} min < ${this.thresholds.simpleRAG} min)`;
    } else {
      return `Video is long (${this.videoLengthMinutes} min > ${this.thresholds.aggressiveRAG} min threshold)`;
    }
  }
  
  /**
   * Get expected savings percentage
   */
  getExpectedSavings() {
    const savings = {
      'direct-cache': '75-80%',
      'smart-rag': '85-90%',
      'aggressive-rag-cache': '94-98%'
    };
    return savings[this.strategy];
  }
}
/**
 * Enhanced RAG System with Vector Embeddings
 * Uses local embeddings for semantic search without external dependencies
 * Designed for maximum cost reduction on long videos
 */

export class EnhancedRAG {
  constructor() {
    this.initialized = false;
    this.embedder = null;
    this.chunks = new Map(); // videoId -> chunks array
    this.embeddings = new Map(); // chunkId -> embedding
    
    // Configuration
    this.config = {
      chunkSize: 800,          // Smaller chunks for better precision
      overlap: 150,            // Overlap between chunks
      embeddingDims: 384,      // MiniLM embedding dimensions
      maxChunksToReturn: 10,   // Maximum chunks to return
      minSimilarity: 0.5       // Minimum similarity threshold
    };
  }

  /**
   * Initialize the enhanced RAG system
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Try to use Chrome's built-in AI if available
      if ('ai' in window && 'embedder' in window.ai) {
        console.log('Using Chrome AI for embeddings');
        this.embedder = await window.ai.embedder();
        this.embeddingMethod = 'chrome-ai';
      } else {
        // Fallback to simple TF-IDF based embeddings
        console.log('Using TF-IDF embeddings (Chrome AI not available)');
        this.embeddingMethod = 'tfidf';
        await this.initializeTFIDF();
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Enhanced RAG:', error);
      // Fallback to simple keyword matching
      this.embeddingMethod = 'keywords';
      this.initialized = true;
    }
  }

  /**
   * Initialize TF-IDF vectorizer as fallback
   */
  async initializeTFIDF() {
    // Simple TF-IDF implementation
    this.vocabulary = new Map();
    this.idfScores = new Map();
    this.vocabIndex = 0;
  }

  /**
   * Index a video transcript
   */
  async indexTranscript(videoId, transcript) {
    console.log(`Indexing transcript for video ${videoId}...`);
    
    // Create chunks
    const chunks = this.createSmartChunks(transcript);
    this.chunks.set(videoId, chunks);
    
    // Generate embeddings for each chunk
    const embeddings = new Map();
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkId = `${videoId}_${i}`;
      
      try {
        const embedding = await this.generateEmbedding(chunk.text);
        embeddings.set(chunkId, embedding);
        
        // Store embedding with chunk
        chunk.embedding = embedding;
        chunk.id = chunkId;
      } catch (error) {
        console.error(`Failed to embed chunk ${i}:`, error);
        // Fallback to keyword representation
        chunk.keywords = this.extractKeywords(chunk.text);
      }
      
      // Show progress for long videos
      if (i % 50 === 0 && i > 0) {
        console.log(`Indexed ${i}/${chunks.length} chunks`);
      }
    }
    
    console.log(`Indexed ${chunks.length} chunks for video ${videoId}`);
    return chunks.length;
  }

  /**
   * Create smart chunks with better boundaries
   */
  createSmartChunks(transcript) {
    const chunks = [];
    let currentChunk = '';
    let chunkStart = null;
    let wordCount = 0;
    
    // Sentence boundaries for better coherence
    const sentenceEnders = /[.!?]\s+/g;
    
    for (const segment of transcript) {
      if (!segment.text?.trim()) continue;
      
      const text = segment.text.trim();
      const words = text.split(/\s+/).length;
      
      if (chunkStart === null) {
        chunkStart = segment.start;
      }
      
      // Check if adding this segment exceeds chunk size
      if (wordCount + words > this.config.chunkSize / 4 && currentChunk) {
        // Try to find a sentence boundary
        const lastSentence = currentChunk.lastIndexOf('. ');
        const cutPoint = lastSentence > currentChunk.length * 0.7 ? lastSentence + 2 : currentChunk.length;
        
        // Save chunk
        chunks.push({
          text: currentChunk.substring(0, cutPoint).trim(),
          start: chunkStart,
          end: segment.start,
          index: chunks.length
        });
        
        // Start new chunk with overlap
        const overlap = currentChunk.substring(Math.max(0, cutPoint - this.config.overlap));
        currentChunk = overlap + ' ' + text;
        chunkStart = segment.start;
        wordCount = overlap.split(/\s+/).length + words;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + text;
        wordCount += words;
      }
    }
    
    // Don't forget the last chunk
    if (currentChunk.trim()) {
      chunks.push({
        text: currentChunk.trim(),
        start: chunkStart,
        end: transcript[transcript.length - 1].start,
        index: chunks.length
      });
    }
    
    return chunks;
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text) {
    switch (this.embeddingMethod) {
      case 'chrome-ai':
        return await this.embedder.embed(text);
        
      case 'tfidf':
        return this.generateTFIDFEmbedding(text);
        
      default:
        return this.generateKeywordEmbedding(text);
    }
  }

  /**
   * Generate TF-IDF embedding
   */
  generateTFIDFEmbedding(text) {
    const words = text.toLowerCase().split(/\s+/)
      .filter(word => word.length > 2);
    
    // Build vocabulary
    const termFreq = new Map();
    words.forEach(word => {
      if (!this.vocabulary.has(word)) {
        this.vocabulary.set(word, this.vocabIndex++);
      }
      termFreq.set(word, (termFreq.get(word) || 0) + 1);
    });
    
    // Create sparse vector (simulate dense for compatibility)
    const embedding = new Array(Math.min(this.config.embeddingDims, this.vocabIndex)).fill(0);
    
    termFreq.forEach((freq, word) => {
      const index = this.vocabulary.get(word);
      if (index < embedding.length) {
        embedding[index] = freq / words.length; // TF
      }
    });
    
    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      embedding.forEach((val, i) => embedding[i] = val / norm);
    }
    
    return embedding;
  }

  /**
   * Generate keyword-based embedding (fallback)
   */
  generateKeywordEmbedding(text) {
    const keywords = this.extractKeywords(text);
    const embedding = new Array(this.config.embeddingDims).fill(0);
    
    // Simple hash-based embedding
    keywords.forEach((keyword, i) => {
      const hash = this.hashString(keyword);
      const index = Math.abs(hash) % embedding.length;
      embedding[index] = 1.0 / (i + 1); // Weight by position
    });
    
    return embedding;
  }

  /**
   * Get relevant context for a query
   */
  async getRelevantContext(query, videoId, options = {}) {
    const chunks = this.chunks.get(videoId);
    if (!chunks || chunks.length === 0) {
      console.warn(`No chunks found for video ${videoId}`);
      return [];
    }
    
    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);
    
    // Calculate similarities
    const similarities = chunks.map(chunk => {
      let similarity = 0;
      
      if (chunk.embedding) {
        similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      } else if (chunk.keywords) {
        // Fallback to keyword matching
        similarity = this.keywordSimilarity(query, chunk.keywords);
      }
      
      // Boost recent context if sequential
      if (options.boostRecent && chunk.index > chunks.length - 10) {
        similarity *= 1.2;
      }
      
      // Boost if contains exact phrases
      const queryLower = query.toLowerCase();
      const chunkLower = chunk.text.toLowerCase();
      if (chunkLower.includes(queryLower)) {
        similarity *= 2;
      }
      
      return {
        ...chunk,
        similarity
      };
    });
    
    // Filter and sort by similarity
    const relevant = similarities
      .filter(chunk => chunk.similarity > this.config.minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, options.maxChunks || this.config.maxChunksToReturn);
    
    // If strategy requires specific distribution
    if (options.strategy === 'distributed') {
      return this.distributeChunks(relevant, chunks, options.maxChunks);
    }
    
    return relevant;
  }

  /**
   * Calculate cosine similarity between embeddings
   */
  cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Calculate keyword-based similarity
   */
  keywordSimilarity(query, keywords) {
    const queryWords = query.toLowerCase().split(/\s+/)
      .filter(word => word.length > 2);
    
    let matches = 0;
    queryWords.forEach(word => {
      if (keywords.includes(word)) matches++;
    });
    
    return matches / Math.max(queryWords.length, keywords.length);
  }

  /**
   * Distribute chunks evenly across video
   */
  distributeChunks(relevant, allChunks, maxChunks) {
    if (relevant.length >= maxChunks) {
      return relevant.slice(0, maxChunks);
    }
    
    // Add chunks from different parts of the video
    const distributed = [...relevant];
    const step = Math.floor(allChunks.length / maxChunks);
    
    for (let i = 0; i < allChunks.length && distributed.length < maxChunks; i += step) {
      const chunk = allChunks[i];
      if (!distributed.find(c => c.index === chunk.index)) {
        distributed.push(chunk);
      }
    }
    
    // Sort by timestamp for coherence
    return distributed.sort((a, b) => a.start - b.start);
  }

  /**
   * Extract keywords for fallback
   */
  extractKeywords(text) {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
      'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this',
      'it', 'from', 'be', 'are', 'been', 'being', 'have', 'has', 'had'
    ]);
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
    
    // Get unique words sorted by frequency
    const wordFreq = new Map();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  /**
   * Simple string hash
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  /**
   * Get memory usage stats
   */
  getMemoryStats() {
    let totalChunks = 0;
    let totalEmbeddings = 0;
    let estimatedMemoryMB = 0;
    
    this.chunks.forEach((chunks, videoId) => {
      totalChunks += chunks.length;
      chunks.forEach(chunk => {
        if (chunk.embedding) {
          totalEmbeddings++;
          estimatedMemoryMB += this.config.embeddingDims * 4 / 1024 / 1024; // 4 bytes per float
        }
      });
    });
    
    return {
      videosIndexed: this.chunks.size,
      totalChunks,
      totalEmbeddings,
      estimatedMemoryMB: estimatedMemoryMB.toFixed(2),
      embeddingMethod: this.embeddingMethod
    };
  }

  /**
   * Clear index for a video
   */
  clearVideoIndex(videoId) {
    this.chunks.delete(videoId);
    
    // Clear associated embeddings
    const keysToDelete = [];
    this.embeddings.forEach((embedding, key) => {
      if (key.startsWith(videoId)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.embeddings.delete(key));
  }

  /**
   * Clear all indices
   */
  clearAllIndices() {
    this.chunks.clear();
    this.embeddings.clear();
    if (this.vocabulary) {
      this.vocabulary.clear();
      this.vocabIndex = 0;
    }
  }
}
# Advanced Cost Reduction Strategies for YouTube Chat Extension

## Executive Summary

This document analyzes advanced strategies for reducing API costs in a Chrome extension that chats with YouTube videos using the Gemini API. The current approach sends the entire transcript (10K-300K tokens) with every message, resulting in costs of $0.50-$5 per message. Through implementing the strategies outlined below, you can potentially reduce costs by 90-95% while maintaining or improving response quality.

## Current Problem

- **Token Usage**: 10K-300K tokens per message
- **Cost Per Message**: $0.50-$5
- **Inefficiency**: Sending entire transcript regardless of query type
- **User Experience**: High latency due to large token processing

## Strategy 1: Vector Database / RAG Implementation

### Overview
Implement Retrieval-Augmented Generation (RAG) using in-browser vector databases to retrieve only relevant transcript portions.

### In-Browser Vector Database Options

#### 1. **VectorIDB (IndexedDB-based)**
- Simple vector database using browser's IndexedDB
- Stores JSON documents with vector embeddings
- Basic API: insert, update, delete, query
- Pros: Simple, no external dependencies
- Cons: Lacks optimizations like pre-filtering

#### 2. **LanceDB (Recommended)**
- Written in Rust, embedded database
- Can search 1 billion vectors in <100ms
- Uses columnar storage format
- Supports multimodal data
- Zero-copy access with SIMD/GPU acceleration
- Pros: Exceptional performance, versioning support
- Cons: More complex setup

#### 3. **ChromaDB**
- Lightweight, embedded-first architecture
- Uses Parquet format for storage
- Optimized for real-time processing
- Pros: Simple API, easy to use
- Cons: Lower performance for complex queries

### Implementation Architecture

```javascript
// Example RAG implementation flow
class YouTubeRAG {
  async initialize(transcript) {
    // 1. Chunk the transcript
    const chunks = await this.semanticChunking(transcript);
    
    // 2. Generate embeddings for each chunk
    const embeddings = await this.generateEmbeddings(chunks);
    
    // 3. Store in vector database
    await this.vectorDB.insertBatch(chunks, embeddings);
  }
  
  async queryRAG(userQuery) {
    // 1. Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(userQuery);
    
    // 2. Retrieve relevant chunks
    const relevantChunks = await this.vectorDB.query(queryEmbedding, k=5);
    
    // 3. Send only relevant context to Gemini
    return await this.callGeminiAPI(userQuery, relevantChunks);
  }
}
```

### Cost Analysis
- **Embedding Generation**: ~$0.001 per video (one-time)
- **Query Cost**: ~$0.01-$0.05 per message (95% reduction)
- **Storage**: Client-side (free)

## Strategy 2: Intelligent Context Selection

### Semantic Chunking Techniques

#### 1. **Sliding Window Approach**
- Create overlapping chunks (20-30% overlap)
- Preserves context at chunk boundaries
- Typical chunk sizes: 256-1024 tokens

```javascript
function slidingWindowChunking(transcript, chunkSize = 512, overlap = 0.25) {
  const chunks = [];
  const step = Math.floor(chunkSize * (1 - overlap));
  
  for (let i = 0; i < transcript.length; i += step) {
    chunks.push(transcript.slice(i, i + chunkSize));
  }
  
  return chunks;
}
```

#### 2. **Semantic-Based Chunking**
- Uses embedding similarity to find breakpoints
- Groups semantically related sentences
- Maintains coherent thought units

```javascript
// Using semantic-chunking library
import { SemanticChunker } from 'semantic-chunking';

const chunker = new SemanticChunker({
  model: 'Xenova/all-MiniLM-L6-v2',
  maxChunkSize: 1000,
  similarityThreshold: 0.8
});

const semanticChunks = await chunker.chunk(transcript);
```

#### 3. **Timestamp-Based Context Windows**
- Leverage YouTube's timestamp data
- Create chunks around specific timeframes
- Useful for time-specific queries

### Query Analysis Strategies

```javascript
class QueryClassifier {
  classifyQuery(query) {
    // Detect query types
    const patterns = {
      specific: /what did.*say about|when.*mention|at what time/i,
      summary: /summarize|overview|main points|key takeaways/i,
      general: /explain|tell me about|what is/i,
      timestamp: /\d+:\d+|beginning|end|minute/i
    };
    
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(query)) {
        return { type, needsFullContext: type === 'summary' };
      }
    }
    
    return { type: 'general', needsFullContext: false };
  }
}
```

## Strategy 3: Hybrid Model Approach

### Chrome's Built-in AI (chrome.ai)

#### Benefits
- **Free**: No API costs
- **Local**: Zero latency
- **Privacy**: Data stays on device
- **Performance**: GPU/NPU acceleration

#### Implementation
```javascript
// Query analysis with Chrome's built-in AI
async function analyzeQueryWithChromeAI(query) {
  if ('ai' in self && 'createTextSession' in self.ai) {
    const session = await self.ai.createTextSession();
    
    const prompt = `Analyze this query and extract key terms: "${query}"
    Return: {
      keywords: [],
      queryType: 'specific' | 'general' | 'summary',
      timeReference: null | timestamp
    }`;
    
    const analysis = await session.prompt(prompt);
    return JSON.parse(analysis);
  }
}
```

### WebLLM Integration

#### Architecture
```javascript
import { CreateMLCEngine } from "@mlc-ai/web-llm";

class HybridProcessor {
  async initialize() {
    // Initialize WebLLM for query analysis
    this.localLLM = await CreateMLCEngine("Llama-3.1-8B-Instruct-q4f32_1");
    
    // Keep Gemini for final responses
    this.geminiClient = new GeminiClient();
  }
  
  async processQuery(query, transcript) {
    // Step 1: Analyze query with local LLM
    const analysis = await this.localLLM.chat.completions.create({
      messages: [{
        role: "system",
        content: "Extract relevant context from the query"
      }, {
        role: "user",
        content: query
      }]
    });
    
    // Step 2: Select relevant chunks
    const relevantContext = await this.selectContext(analysis, transcript);
    
    // Step 3: Generate final response with Gemini
    return await this.geminiClient.generate(query, relevantContext);
  }
}
```

### Cost Savings
- Local query analysis: $0
- Reduced Gemini tokens: 80-90% savings
- Total cost per message: $0.05-$0.25

## Strategy 4: Smart Chunking Implementation

### JavaScript Libraries Comparison

#### 1. **llm-chunk**
- Fixed-size chunking with overlap
- Simple and efficient
- Good for basic implementations

#### 2. **LangChain**
```javascript
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ["\n\n", "\n", " ", ""]
});

const chunks = await splitter.splitText(transcript);
```

#### 3. **semantic-chunking**
- Uses local embeddings for semantic grouping
- Groups related sentences automatically
- Best for maintaining context coherence

### Implementation Best Practices

```javascript
class TranscriptChunker {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 512;
    this.overlap = options.overlap || 0.25;
    this.method = options.method || 'semantic';
  }
  
  async chunkTranscript(transcript, timestamps) {
    switch (this.method) {
      case 'semantic':
        return await this.semanticChunk(transcript);
      case 'timestamp':
        return this.timestampChunk(transcript, timestamps);
      case 'sliding':
        return this.slidingWindowChunk(transcript);
      default:
        throw new Error('Unknown chunking method');
    }
  }
  
  semanticChunk(transcript) {
    // Implementation using semantic-chunking library
  }
  
  timestampChunk(transcript, timestamps) {
    // Chunk based on natural breaks in timestamps
  }
  
  slidingWindowChunk(transcript) {
    // Sliding window with overlap
  }
}
```

## Strategy 5: Query Classification System

### Multi-Level Classification

```javascript
class AdvancedQueryClassifier {
  constructor() {
    this.patterns = {
      factual: {
        pattern: /what|when|where|who|how many|which/i,
        contextNeeded: 'minimal'
      },
      explanatory: {
        pattern: /explain|why|how does|describe/i,
        contextNeeded: 'moderate'
      },
      summary: {
        pattern: /summarize|overview|main points|key/i,
        contextNeeded: 'full'
      },
      temporal: {
        pattern: /\d+:\d+|beginning|end|first|last/i,
        contextNeeded: 'timestamp'
      },
      comparative: {
        pattern: /compare|versus|different|similar/i,
        contextNeeded: 'targeted'
      }
    };
  }
  
  async classifyAndRoute(query, transcript) {
    const classification = this.classify(query);
    
    switch (classification.contextNeeded) {
      case 'minimal':
        // Use top 3 most relevant chunks
        return await this.getMinimalContext(query, transcript, 3);
        
      case 'moderate':
        // Use 5-7 relevant chunks
        return await this.getModerateContext(query, transcript, 7);
        
      case 'full':
        // Use smart summarization
        return await this.getFullSummary(transcript);
        
      case 'timestamp':
        // Extract timestamp and surrounding context
        return await this.getTimestampContext(query, transcript);
        
      case 'targeted':
        // Find specific sections for comparison
        return await this.getTargetedContext(query, transcript);
    }
  }
}
```

## Implementation Roadmap

### Phase 1: Basic RAG (Week 1-2)
1. Implement semantic chunking
2. Set up IndexedDB vector storage
3. Basic embedding generation
4. Simple query retrieval

### Phase 2: Chrome AI Integration (Week 3)
1. Integrate chrome.ai for query analysis
2. Implement query classification
3. Add fallback for unsupported browsers

### Phase 3: Advanced Optimization (Week 4-5)
1. Implement sliding window chunking
2. Add timestamp-based retrieval
3. Optimize chunk sizes
4. A/B test different strategies

### Phase 4: Production Ready (Week 6)
1. Add caching layer
2. Implement error handling
3. Performance monitoring
4. User preference settings

## Performance Metrics

### Before Optimization
- Average tokens per query: 50,000
- Cost per query: $2.50
- Response time: 5-10 seconds
- Memory usage: 500MB+

### After Optimization (Expected)
- Average tokens per query: 2,500
- Cost per query: $0.125 (95% reduction)
- Response time: 1-2 seconds
- Memory usage: 50-100MB

## Code Example: Complete Implementation

```javascript
// main.js - Chrome Extension Entry Point
class YouTubeChatOptimizer {
  constructor() {
    this.vectorDB = new VectorIDB('youtube-transcripts');
    this.queryClassifier = new QueryClassifier();
    this.chunker = new TranscriptChunker({ method: 'semantic' });
    this.useLocalAI = 'ai' in self;
  }
  
  async processVideo(videoId, transcript, timestamps) {
    // One-time processing per video
    const chunks = await this.chunker.chunkTranscript(transcript, timestamps);
    const embeddings = await this.generateEmbeddings(chunks);
    
    await this.vectorDB.store(videoId, chunks, embeddings);
    
    return {
      videoId,
      chunkCount: chunks.length,
      ready: true
    };
  }
  
  async handleUserQuery(query, videoId) {
    // Step 1: Classify query
    const classification = await this.queryClassifier.classify(query);
    
    // Step 2: Analyze with local AI if available
    let analysis = null;
    if (this.useLocalAI) {
      analysis = await this.analyzeWithChromeAI(query);
    }
    
    // Step 3: Retrieve relevant context
    const relevantChunks = await this.retrieveContext(
      query, 
      videoId, 
      classification,
      analysis
    );
    
    // Step 4: Generate response with minimal tokens
    const response = await this.callGeminiAPI({
      query,
      context: relevantChunks,
      maxTokens: classification.contextNeeded === 'full' ? 2000 : 1000
    });
    
    return {
      response,
      tokensUsed: relevantChunks.join('').length,
      cost: this.calculateCost(relevantChunks)
    };
  }
  
  async retrieveContext(query, videoId, classification, analysis) {
    if (classification.contextNeeded === 'full') {
      // For summaries, use pre-computed summary
      return await this.getVideoSummary(videoId);
    }
    
    // For other queries, use vector search
    const queryEmbedding = await this.generateEmbedding(query);
    const topChunks = await this.vectorDB.query(
      videoId,
      queryEmbedding,
      k = classification.contextNeeded === 'minimal' ? 3 : 7
    );
    
    return topChunks.map(chunk => chunk.text);
  }
}
```

## Conclusion

By implementing these strategies, you can achieve:

1. **95% Cost Reduction**: From $2.50 to $0.125 per query
2. **80% Faster Responses**: From 5-10s to 1-2s
3. **Better User Experience**: More relevant, focused responses
4. **Privacy Enhancement**: Local processing options
5. **Scalability**: Handle longer videos without proportional cost increase

The recommended approach is to start with basic RAG implementation using semantic chunking and gradually add more sophisticated features like Chrome AI integration and advanced query classification. This phased approach allows you to see immediate cost benefits while building toward a more intelligent system.
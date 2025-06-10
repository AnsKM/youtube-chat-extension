/**
 * Query Classifier - Analyzes user queries to determine optimal retrieval strategy
 * Identifies query types, extracts features, and provides routing hints
 */

export class QueryClassifier {
  constructor() {
    // Query type patterns
    this.patterns = {
      // Timestamp-related patterns
      timestamp: {
        explicit: /(?:at\s+)?(\d{1,3}):(\d{2})(?::(\d{2}))?/gi,
        relative: /(?:around|near|about)\s+(\d{1,3}):(\d{2})/gi,
        descriptive: /(?:beginning|start|end|middle|first|last)\s+(?:of|part)/gi,
        minutes: /(\d+)\s*(?:minute|min)s?\s*(?:in|into|through)/gi
      },
      
      // Summary/overview patterns
      summary: {
        explicit: /(?:summar|overview|recap|main\s+points?|key\s+(?:takeaways?|points?)|highlights?)/i,
        implicit: /(?:what\s+(?:is|was|are|were)\s+(?:the|this)\s+(?:video|content|topic)|overall|in\s+general|basically)/i,
        tldr: /(?:tl;?dr|too\s+long|brief(?:ly)?|short\s+version)/i
      },
      
      // Specific information patterns
      specific: {
        wh_questions: /^(?:what|when|where|who|why|how|which)/i,
        explain: /(?:explain|describe|tell\s+me|talk\s+about|discuss)/i,
        definition: /(?:what\s+(?:is|are|does|do)|define|meaning\s+of)/i,
        example: /(?:example|instance|such\s+as|like\s+what)/i
      },
      
      // Comparison patterns
      comparison: {
        versus: /(?:compar|versus|vs\.?|differ|between|contrast)/i,
        similarity: /(?:similar|same|alike|in\s+common)/i,
        better: /(?:better|worse|best|worst|advantage|disadvantage)/i
      },
      
      // List/enumeration patterns
      list: {
        explicit: /(?:list|enumerate|name\s+(?:all|every)|what\s+are\s+(?:all|the))/i,
        counting: /(?:how\s+many|count|number\s+of)/i,
        steps: /(?:steps?|process|procedure|instructions?)/i
      },
      
      // Topic-specific patterns
      topic: {
        about: /(?:about|regarding|concerning|related\s+to)/i,
        mention: /(?:mention|say|talk)\s+(?:about|regarding)/i,
        reference: /(?:refer|reference|cite|quote)/i
      },
      
      // Sentiment/opinion patterns
      opinion: {
        thinks: /(?:think|opinion|view|perspective|stance)/i,
        recommends: /(?:recommend|suggest|advise|best|should)/i,
        evaluates: /(?:good|bad|pros?|cons?|advantages?|disadvantages?)/i
      }
    };
    
    // Feature extraction keywords
    this.keywords = {
      temporal: ['before', 'after', 'during', 'when', 'while', 'then', 'next', 'previous', 'later', 'earlier'],
      causal: ['because', 'therefore', 'so', 'thus', 'hence', 'consequently', 'result', 'cause', 'effect'],
      conditional: ['if', 'unless', 'provided', 'assuming', 'suppose', 'whether'],
      quantitative: ['how much', 'how many', 'percentage', 'amount', 'number', 'count', 'total']
    };
  }

  /**
   * Analyze a query and extract features
   */
  analyze(query) {
    console.log('\n  🤔 QUERY CLASSIFIER ANALYSIS');
    console.log('  '.repeat(20));
    console.log(`  Input: "${query}"`);
    
    const analysis = {
      type: 'general',
      confidence: 0.5,
      features: [],
      hints: {},
      complexity: 'medium',
      needsContext: true,
      priority: 'normal'
    };

    // Clean query for analysis
    const cleanQuery = query.trim().toLowerCase();
    
    // Extract timestamp if present
    const timestampInfo = this.extractTimestamp(query);
    if (timestampInfo) {
      analysis.type = 'timestamp';
      analysis.confidence = 0.9;
      analysis.features.push('has_timestamp');
      analysis.hints.timestamp = timestampInfo;
      analysis.needsContext = false; // Can focus on specific time
      analysis.priority = 'high';
      analysis.hasTimestamp = true;
      analysis.isSummary = false;
      console.log(`  ✓ Detected: TIMESTAMP query (${timestampInfo.formatted})`);
    }
    
    // Check for summary request
    else if (this.isSummaryRequest(cleanQuery)) {
      analysis.type = 'summary';
      analysis.confidence = 0.85;
      analysis.features.push('wants_overview');
      analysis.hints.distribution = 'even'; // Sample across video
      analysis.complexity = 'high';
      analysis.hasTimestamp = false;
      analysis.isSummary = true;
      console.log('  ✓ Detected: SUMMARY request');
    }
    
    // Check for specific information
    else if (this.isSpecificQuery(cleanQuery)) {
      analysis.type = 'specific';
      analysis.confidence = 0.75;
      analysis.features.push('targeted_search');
      analysis.hints.depth = 'detailed';
      analysis.hasTimestamp = false;
      analysis.isSummary = false;
      
      // Extract key terms for focused search
      analysis.hints.keyTerms = this.extractKeyTerms(cleanQuery);
      console.log('  ✓ Detected: SPECIFIC information query');
      console.log(`  → Key terms: ${analysis.hints.keyTerms.keywords.slice(0, 5).join(', ')}`);
    }
    
    // Check for comparison
    else if (this.isComparisonQuery(cleanQuery)) {
      analysis.type = 'comparison';
      analysis.confidence = 0.8;
      analysis.features.push('needs_multiple_points');
      analysis.complexity = 'high';
      analysis.hints.chunks = 'multiple'; // Need various parts
      analysis.hasTimestamp = false;
      analysis.isSummary = false;
      console.log('  ✓ Detected: COMPARISON query');
    }
    
    // Check for list/enumeration
    else if (this.isListQuery(cleanQuery)) {
      analysis.type = 'list';
      analysis.confidence = 0.8;
      analysis.features.push('wants_enumeration');
      analysis.hints.format = 'structured';
      analysis.complexity = 'high';
      analysis.hasTimestamp = false;
      analysis.isSummary = false;
      console.log('  ✓ Detected: LIST/ENUMERATION query');
    }
    else {
      analysis.hasTimestamp = false;
      analysis.isSummary = false;
      console.log('  ✓ Detected: GENERAL query');
    }
    
    // Add complexity scoring
    analysis.complexity = this.assessComplexity(query, analysis);
    
    // Add detail level hint
    analysis.needsDetail = this.needsDetailedResponse(query, analysis);
    
    // Add whether query is about the whole video
    analysis.isGlobal = this.isGlobalQuery(cleanQuery);
    
    console.log(`  • Complexity: ${analysis.complexity}`);
    console.log(`  • Needs detail: ${analysis.needsDetail ? 'Yes' : 'No'}`);
    console.log(`  • Global scope: ${analysis.isGlobal ? 'Yes' : 'No'}`);
    console.log('  '.repeat(20));
    
    return analysis;
  }

  /**
   * Extract timestamp from query
   */
  extractTimestamp(query) {
    // Check for explicit timestamp
    const explicitMatch = this.patterns.timestamp.explicit.exec(query);
    if (explicitMatch) {
      const hours = 0;
      const minutes = parseInt(explicitMatch[1]);
      const seconds = parseInt(explicitMatch[2]);
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      
      return {
        formatted: explicitMatch[0],
        totalSeconds,
        type: 'explicit'
      };
    }
    
    // Check for minute markers
    const minuteMatch = this.patterns.timestamp.minutes.exec(query);
    if (minuteMatch) {
      const minutes = parseInt(minuteMatch[1]);
      return {
        formatted: minuteMatch[0],
        totalSeconds: minutes * 60,
        type: 'minutes'
      };
    }
    
    // Check for descriptive timestamps
    const descriptiveMatch = this.patterns.timestamp.descriptive.exec(query);
    if (descriptiveMatch) {
      const position = descriptiveMatch[0].includes('beginning') || descriptiveMatch[0].includes('start') 
        ? 'start' 
        : descriptiveMatch[0].includes('end') || descriptiveMatch[0].includes('last')
        ? 'end'
        : 'middle';
        
      return {
        formatted: descriptiveMatch[0],
        position,
        type: 'descriptive'
      };
    }
    
    return null;
  }

  /**
   * Check if query is asking for summary
   */
  isSummaryRequest(query) {
    return Object.values(this.patterns.summary).some(pattern => pattern.test(query));
  }

  /**
   * Check if query is asking for specific information
   */
  isSpecificQuery(query) {
    return Object.values(this.patterns.specific).some(pattern => pattern.test(query));
  }

  /**
   * Check if query involves comparison
   */
  isComparisonQuery(query) {
    return Object.values(this.patterns.comparison).some(pattern => pattern.test(query));
  }

  /**
   * Check if query wants a list
   */
  isListQuery(query) {
    return Object.values(this.patterns.list).some(pattern => pattern.test(query));
  }

  /**
   * Check if query is about the whole video
   */
  isGlobalQuery(query) {
    const globalPatterns = [
      /(?:whole|entire|complete|full)\s+video/i,
      /(?:everything|all|overall|general)/i,
      /(?:from\s+start\s+to\s+(?:end|finish))/i,
      /(?:throughout|across|during)\s+(?:the\s+)?video/i
    ];
    
    return globalPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Extract key terms for focused search
   */
  extractKeyTerms(query) {
    // Remove common words and extract important terms
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
      'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this',
      'it', 'from', 'be', 'are', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may',
      'might', 'must', 'can', 'i', 'you', 'he', 'she', 'we', 'they',
      'what', 'when', 'where', 'who', 'why', 'how', 'video', 'tell', 'me'
    ]);
    
    // Extract quoted phrases first
    const quotedPhrases = [];
    const quotedPattern = /"([^"]+)"/g;
    let match;
    while ((match = quotedPattern.exec(query)) !== null) {
      quotedPhrases.push(match[1]);
    }
    
    // Clean query and extract words
    const cleanQuery = query.toLowerCase()
      .replace(quotedPattern, '') // Remove quoted parts
      .replace(/[^\w\s]/g, ' ');
      
    const words = cleanQuery.split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
    
    // Extract noun phrases (simple approach)
    const nounPhrases = this.extractNounPhrases(cleanQuery);
    
    return {
      quoted: quotedPhrases,
      keywords: [...new Set(words)].slice(0, 10),
      phrases: nounPhrases,
      priority: this.prioritizeTerms([...quotedPhrases, ...words])
    };
  }

  /**
   * Simple noun phrase extraction
   */
  extractNounPhrases(text) {
    // Simple pattern for adjective + noun combinations
    const phrasePatterns = [
      /(\w+)\s+(learning|network|model|system|algorithm|method|approach|technique)/gi,
      /(\w+)\s+(data|information|knowledge|concept|idea|theory|principle)/gi,
      /(machine|deep|artificial|neural)\s+(\w+)/gi
    ];
    
    const phrases = [];
    phrasePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        phrases.push(match[0]);
      }
    });
    
    return [...new Set(phrases)];
  }

  /**
   * Prioritize terms based on importance
   */
  prioritizeTerms(terms) {
    // Technical terms get higher priority
    const technicalTerms = new Set([
      'algorithm', 'model', 'neural', 'network', 'learning', 'training',
      'data', 'feature', 'optimization', 'gradient', 'function', 'parameter',
      'architecture', 'layer', 'tensor', 'vector', 'matrix', 'dimension'
    ]);
    
    return terms.sort((a, b) => {
      const aIsTechnical = technicalTerms.has(a.toLowerCase());
      const bIsTechnical = technicalTerms.has(b.toLowerCase());
      
      if (aIsTechnical && !bIsTechnical) return -1;
      if (!aIsTechnical && bIsTechnical) return 1;
      
      // Longer terms often more specific
      return b.length - a.length;
    }).slice(0, 5);
  }

  /**
   * Assess query complexity
   */
  assessComplexity(query, analysis) {
    let score = 0;
    
    // Length factor
    const wordCount = query.split(/\s+/).length;
    if (wordCount > 20) score += 2;
    else if (wordCount > 10) score += 1;
    
    // Multiple questions
    if ((query.match(/\?/g) || []).length > 1) score += 2;
    
    // Conjunctions suggesting multiple parts
    if (/\b(and|also|additionally|furthermore|moreover)\b/i.test(query)) score += 1;
    
    // Specific patterns that increase complexity
    if (analysis.type === 'comparison' || analysis.type === 'list') score += 1;
    if (analysis.features.includes('needs_multiple_points')) score += 1;
    
    // Conditional or hypothetical
    if (/\b(if|assuming|suppose|whether|depends)\b/i.test(query)) score += 1;
    
    return score > 3 ? 'high' : score > 1 ? 'medium' : 'low';
  }

  /**
   * Determine if query needs detailed response
   */
  needsDetailedResponse(query, analysis) {
    // Questions that typically need detail
    const detailPatterns = [
      /(?:explain|describe)\s+(?:in\s+detail|thoroughly|comprehensively)/i,
      /(?:how\s+(?:exactly|specifically)|step[\s-]by[\s-]step)/i,
      /(?:all|every|each|complete|full)\s+(?:detail|aspect|part)/i,
      /(?:deep|thorough|comprehensive|detailed)\s+(?:explanation|analysis)/i
    ];
    
    if (detailPatterns.some(pattern => pattern.test(query))) return true;
    
    // Complex queries usually need detail
    if (analysis.complexity === 'high') return true;
    
    // Lists and comparisons often need detail
    if (['list', 'comparison'].includes(analysis.type)) return true;
    
    return false;
  }

  /**
   * Get retrieval strategy based on analysis
   */
  getRetrievalStrategy(analysis, videoLength) {
    const strategies = {
      timestamp: {
        method: 'timestamp_window',
        chunkCount: 3,
        windowSize: 120, // seconds before/after
        distribution: 'focused'
      },
      
      summary: {
        method: 'distributed_sampling',
        chunkCount: videoLength > 60 ? 8 : 6,
        distribution: 'even',
        prioritize: 'key_sections'
      },
      
      specific: {
        method: 'semantic_search',
        chunkCount: 5,
        scoreThreshold: 0.7,
        expandSearch: analysis.needsDetail
      },
      
      comparison: {
        method: 'multi_point_search',
        chunkCount: 6,
        distribution: 'diverse',
        requireMultiple: true
      },
      
      list: {
        method: 'comprehensive_search',
        chunkCount: 8,
        distribution: 'thorough',
        groupSimilar: true
      },
      
      general: {
        method: 'balanced_search',
        chunkCount: 5,
        distribution: 'smart',
        adaptToLength: true
      }
    };
    
    return strategies[analysis.type] || strategies.general;
  }
}
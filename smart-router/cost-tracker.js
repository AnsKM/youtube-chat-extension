/**
 * Cost Tracker - Monitors API usage and calculates savings
 * Tracks both actual costs and savings from optimization strategies
 */

export class CostTracker {
  constructor() {
    this.storageKey = 'youtube_chat_cost_tracker';
    this.sessionKey = 'youtube_chat_session';
    
    // Gemini 2.5 Flash Preview pricing
    this.pricing = {
      input: 0.15 / 1000000,        // $0.15 per 1M tokens
      output: 0.60 / 1000000,       // $0.60 per 1M tokens
      cachedInput: 0.0375 / 1000000, // $0.0375 per 1M tokens (75% discount)
      cacheStorage: 1.00 / 1000000   // $1.00 per 1M tokens per hour
    };
    
    // Initialize tracking data
    this.currentSession = {
      startTime: Date.now(),
      queries: [],
      totalCost: 0,
      totalSavings: 0,
      totalTokens: {
        input: 0,
        output: 0,
        cached: 0
      }
    };
    
    this.loadHistoricalData();
  }

  /**
   * Load historical data from storage
   */
  async loadHistoricalData() {
    try {
      const stored = await chrome.storage.local.get([this.storageKey, this.sessionKey]);
      
      if (stored[this.storageKey]) {
        this.historicalData = stored[this.storageKey];
      } else {
        this.historicalData = {
          firstUse: Date.now(),
          totalQueries: 0,
          totalCost: 0,
          totalSavings: 0,
          dailyStats: {},
          strategyStats: {
            'direct-cache': { queries: 0, cost: 0, savings: 0 },
            'smart-rag': { queries: 0, cost: 0, savings: 0 },
            'aggressive-rag-cache': { queries: 0, cost: 0, savings: 0 }
          }
        };
      }
      
      // Restore current session if exists
      if (stored[this.sessionKey]) {
        this.currentSession = stored[this.sessionKey];
      }
    } catch (error) {
      console.error('Failed to load cost tracking data:', error);
    }
  }

  /**
   * Track a query and calculate costs
   */
  async track({ strategy, inputTokens, outputTokens, cached, videoLength, processingTime }) {
    // Calculate actual cost
    const inputCost = cached 
      ? inputTokens * this.pricing.cachedInput
      : inputTokens * this.pricing.input;
    
    const outputCost = outputTokens * this.pricing.output;
    const totalCost = inputCost + outputCost;
    
    // Calculate what it would have cost without optimization
    const videoMinutes = Math.floor(videoLength / 60);
    const estimatedFullTranscriptTokens = videoMinutes * 500; // ~500 tokens per minute
    const baselineCost = estimatedFullTranscriptTokens * this.pricing.input + outputCost;
    
    // Calculate savings
    const savings = baselineCost - totalCost;
    const savingsPercent = (savings / baselineCost) * 100;
    
    // Create query record
    const queryRecord = {
      timestamp: Date.now(),
      strategy,
      videoLength,
      tokens: {
        input: inputTokens,
        output: outputTokens,
        cached: cached ? inputTokens : 0,
        baseline: estimatedFullTranscriptTokens
      },
      cost: {
        actual: totalCost,
        baseline: baselineCost,
        savings: savings,
        savingsPercent: savingsPercent
      },
      performance: {
        processingTime,
        tokensPerSecond: inputTokens / (processingTime / 1000)
      }
    };
    
    // Update session
    this.currentSession.queries.push(queryRecord);
    this.currentSession.totalCost += totalCost;
    this.currentSession.totalSavings += savings;
    this.currentSession.totalTokens.input += inputTokens;
    this.currentSession.totalTokens.output += outputTokens;
    if (cached) {
      this.currentSession.totalTokens.cached += inputTokens;
    }
    
    // Update historical data
    await this.updateHistoricalData(queryRecord);
    
    // Log for debugging
    console.log(`Cost Tracking:
      Strategy: ${strategy}
      Tokens: ${inputTokens} input (${cached ? 'cached' : 'fresh'}), ${outputTokens} output
      Cost: $${totalCost.toFixed(6)} (saved $${savings.toFixed(6)} = ${savingsPercent.toFixed(1)}%)
      Processing: ${processingTime.toFixed(0)}ms`);
    
    return {
      cost: totalCost,
      savings: savings,
      savingsPercent: savingsPercent,
      performance: queryRecord.performance
    };
  }

  /**
   * Update historical data
   */
  async updateHistoricalData(queryRecord) {
    // Update totals
    this.historicalData.totalQueries++;
    this.historicalData.totalCost += queryRecord.cost.actual;
    this.historicalData.totalSavings += queryRecord.cost.savings;
    
    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    if (!this.historicalData.dailyStats[today]) {
      this.historicalData.dailyStats[today] = {
        queries: 0,
        cost: 0,
        savings: 0,
        tokens: { input: 0, output: 0, cached: 0 }
      };
    }
    
    const dailyStats = this.historicalData.dailyStats[today];
    dailyStats.queries++;
    dailyStats.cost += queryRecord.cost.actual;
    dailyStats.savings += queryRecord.cost.savings;
    dailyStats.tokens.input += queryRecord.tokens.input;
    dailyStats.tokens.output += queryRecord.tokens.output;
    dailyStats.tokens.cached += queryRecord.tokens.cached || 0;
    
    // Update strategy stats
    const strategyStats = this.historicalData.strategyStats[queryRecord.strategy];
    if (strategyStats) {
      strategyStats.queries++;
      strategyStats.cost += queryRecord.cost.actual;
      strategyStats.savings += queryRecord.cost.savings;
    }
    
    // Save to storage
    await this.persist();
  }

  /**
   * Get current session stats
   */
  getSessionStats() {
    const duration = Date.now() - this.currentSession.startTime;
    const avgCostPerQuery = this.currentSession.queries.length > 0
      ? this.currentSession.totalCost / this.currentSession.queries.length
      : 0;
    
    return {
      duration: duration,
      queries: this.currentSession.queries.length,
      totalCost: this.currentSession.totalCost,
      totalSavings: this.currentSession.totalSavings,
      avgCostPerQuery: avgCostPerQuery,
      totalTokens: this.currentSession.totalTokens,
      recentQueries: this.currentSession.queries.slice(-5)
    };
  }

  /**
   * Get overall statistics
   */
  getOverallStats() {
    const daysSinceFirstUse = Math.floor((Date.now() - this.historicalData.firstUse) / (1000 * 60 * 60 * 24));
    const avgDailyCost = daysSinceFirstUse > 0 
      ? this.historicalData.totalCost / daysSinceFirstUse
      : this.historicalData.totalCost;
    
    // Calculate strategy effectiveness
    const strategyEffectiveness = {};
    Object.entries(this.historicalData.strategyStats).forEach(([strategy, stats]) => {
      if (stats.queries > 0) {
        strategyEffectiveness[strategy] = {
          avgCost: stats.cost / stats.queries,
          avgSavings: stats.savings / stats.queries,
          avgSavingsPercent: (stats.savings / (stats.cost + stats.savings)) * 100,
          usage: (stats.queries / this.historicalData.totalQueries) * 100
        };
      }
    });
    
    // Get last 7 days trend
    const last7Days = this.getLast7DaysTrend();
    
    return {
      lifetime: {
        totalQueries: this.historicalData.totalQueries,
        totalCost: this.historicalData.totalCost,
        totalSavings: this.historicalData.totalSavings,
        avgCostPerQuery: this.historicalData.totalQueries > 0 
          ? this.historicalData.totalCost / this.historicalData.totalQueries
          : 0,
        daysSinceFirstUse: daysSinceFirstUse,
        avgDailyCost: avgDailyCost
      },
      strategies: strategyEffectiveness,
      trend: last7Days,
      projections: this.getProjections()
    };
  }

  /**
   * Get last 7 days trend
   */
  getLast7DaysTrend() {
    const trend = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayStats = this.historicalData.dailyStats[dateStr] || {
        queries: 0,
        cost: 0,
        savings: 0,
        tokens: { input: 0, output: 0, cached: 0 }
      };
      
      trend.push({
        date: dateStr,
        ...dayStats
      });
    }
    
    return trend;
  }

  /**
   * Get cost projections
   */
  getProjections() {
    const avgDailyQueries = this.historicalData.totalQueries / 
      Math.max(1, Object.keys(this.historicalData.dailyStats).length);
    
    const avgCostPerQuery = this.historicalData.totalQueries > 0
      ? this.historicalData.totalCost / this.historicalData.totalQueries
      : 0;
    
    return {
      daily: avgDailyQueries * avgCostPerQuery,
      weekly: avgDailyQueries * avgCostPerQuery * 7,
      monthly: avgDailyQueries * avgCostPerQuery * 30,
      yearly: avgDailyQueries * avgCostPerQuery * 365,
      savingsMonthly: (this.historicalData.totalSavings / this.historicalData.totalQueries) * avgDailyQueries * 30
    };
  }

  /**
   * Export data as CSV
   */
  exportAsCSV() {
    const headers = ['Date', 'Time', 'Strategy', 'Video Length', 'Input Tokens', 'Output Tokens', 'Cached', 'Cost', 'Savings', 'Savings %'];
    const rows = [headers];
    
    this.currentSession.queries.forEach(query => {
      const date = new Date(query.timestamp);
      rows.push([
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        query.strategy,
        `${Math.floor(query.videoLength / 60)}min`,
        query.tokens.input,
        query.tokens.output,
        query.tokens.cached > 0 ? 'Yes' : 'No',
        `$${query.cost.actual.toFixed(6)}`,
        `$${query.cost.savings.toFixed(6)}`,
        `${query.cost.savingsPercent.toFixed(1)}%`
      ]);
    });
    
    return rows.map(row => row.join(',')).join('\n');
  }

  /**
   * Clear session data
   */
  async clearSession() {
    this.currentSession = {
      startTime: Date.now(),
      queries: [],
      totalCost: 0,
      totalSavings: 0,
      totalTokens: {
        input: 0,
        output: 0,
        cached: 0
      }
    };
    
    await chrome.storage.local.remove(this.sessionKey);
  }

  /**
   * Reset all tracking data
   */
  async resetAll() {
    this.historicalData = {
      firstUse: Date.now(),
      totalQueries: 0,
      totalCost: 0,
      totalSavings: 0,
      dailyStats: {},
      strategyStats: {
        'direct-cache': { queries: 0, cost: 0, savings: 0 },
        'smart-rag': { queries: 0, cost: 0, savings: 0 },
        'aggressive-rag-cache': { queries: 0, cost: 0, savings: 0 }
      }
    };
    
    await this.clearSession();
    await chrome.storage.local.remove(this.storageKey);
  }

  /**
   * Persist data to storage
   */
  async persist() {
    try {
      await chrome.storage.local.set({
        [this.storageKey]: this.historicalData,
        [this.sessionKey]: this.currentSession
      });
    } catch (error) {
      console.error('Failed to persist cost tracking data:', error);
    }
  }

  /**
   * Get formatted cost display
   */
  formatCost(amount) {
    if (amount < 0.01) {
      return `$${amount.toFixed(6)}`;
    } else if (amount < 1) {
      return `$${amount.toFixed(4)}`;
    } else {
      return `$${amount.toFixed(2)}`;
    }
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations() {
    const recommendations = [];
    
    // Analyze strategy usage
    const mostUsedStrategy = Object.entries(this.historicalData.strategyStats)
      .sort((a, b) => b[1].queries - a[1].queries)[0];
    
    if (mostUsedStrategy && mostUsedStrategy[1].queries > 0) {
      const avgSavings = mostUsedStrategy[1].savings / mostUsedStrategy[1].queries;
      if (avgSavings < 0.001) {
        recommendations.push({
          type: 'strategy',
          message: 'Consider using more aggressive optimization for longer videos',
          priority: 'high'
        });
      }
    }
    
    // Check cache usage
    const cacheRatio = this.currentSession.totalTokens.cached / 
                      Math.max(1, this.currentSession.totalTokens.input);
    
    if (cacheRatio < 0.3 && this.currentSession.queries.length > 5) {
      recommendations.push({
        type: 'caching',
        message: 'Enable context caching to save 75% on repeated queries',
        priority: 'high'
      });
    }
    
    // Check query patterns
    const avgTokensPerQuery = this.currentSession.totalTokens.input / 
                             Math.max(1, this.currentSession.queries.length);
    
    if (avgTokensPerQuery > 50000) {
      recommendations.push({
        type: 'optimization',
        message: 'Your queries use large contexts. RAG could reduce costs by 90%+',
        priority: 'critical'
      });
    }
    
    return recommendations;
  }
}
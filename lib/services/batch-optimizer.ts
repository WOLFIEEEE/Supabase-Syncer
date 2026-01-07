/**
 * Batch Optimizer Service
 * 
 * Dynamically adjusts batch sizes based on row size and processing time
 * to optimize sync performance.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface BatchConfig {
  minBatchSize: number;
  maxBatchSize: number;
  targetBatchTimeMs: number;
  maxMemoryMB: number;
  initialBatchSize: number;
}

export interface BatchResult {
  tableName: string;
  batchSize: number;
  rowCount: number;
  avgRowSizeBytes: number;
  durationMs: number;
  success: boolean;
  timestamp: Date;
}

export interface BatchRecommendation {
  recommendedBatchSize: number;
  confidence: 'low' | 'medium' | 'high';
  reason: string;
  estimatedTimeMs: number;
  estimatedMemoryMB: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: BatchConfig = {
  minBatchSize: 50,
  maxBatchSize: 5000,
  targetBatchTimeMs: 2000, // 2 seconds
  maxMemoryMB: 256,
  initialBatchSize: 100,
};

// ============================================================================
// BATCH OPTIMIZER CLASS
// ============================================================================

export class BatchOptimizer {
  private config: BatchConfig;
  private batchHistory: Map<string, BatchResult[]> = new Map();
  private tableRowSizes: Map<string, number> = new Map();
  
  constructor(config: Partial<BatchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Calculate optimal batch size based on row size and history
   */
  calculateOptimalBatchSize(
    tableName: string,
    avgRowSizeBytes: number,
    lastBatchTimeMs?: number
  ): BatchRecommendation {
    // Store row size for future reference
    this.tableRowSizes.set(tableName, avgRowSizeBytes);
    
    // Get batch history for this table
    const history = this.batchHistory.get(tableName) || [];
    
    // If no history, use initial batch size with memory constraint
    if (history.length === 0) {
      const memoryConstrainedSize = Math.floor(
        (this.config.maxMemoryMB * 1024 * 1024) / avgRowSizeBytes
      );
      
      const initialSize = Math.min(
        this.config.initialBatchSize,
        memoryConstrainedSize,
        this.config.maxBatchSize
      );
      
      return {
        recommendedBatchSize: Math.max(initialSize, this.config.minBatchSize),
        confidence: 'low',
        reason: 'Initial batch size based on memory constraints',
        estimatedTimeMs: 0,
        estimatedMemoryMB: (initialSize * avgRowSizeBytes) / (1024 * 1024),
      };
    }
    
    // Calculate average time per row from recent history
    const recentHistory = history.slice(-5);
    const avgTimePerRow = recentHistory.reduce((sum, r) => {
      return sum + (r.durationMs / r.rowCount);
    }, 0) / recentHistory.length;
    
    // Calculate recommended batch size based on target time
    let recommendedSize = Math.floor(this.config.targetBatchTimeMs / avgTimePerRow);
    
    // Adjust based on last batch performance
    if (lastBatchTimeMs !== undefined) {
      if (lastBatchTimeMs < this.config.targetBatchTimeMs * 0.5) {
        // Last batch was fast, increase by 50%
        recommendedSize = Math.floor(recommendedSize * 1.5);
      } else if (lastBatchTimeMs > this.config.targetBatchTimeMs * 1.5) {
        // Last batch was slow, decrease by 25%
        recommendedSize = Math.floor(recommendedSize * 0.75);
      }
    }
    
    // Apply memory constraint
    const memoryConstrainedSize = Math.floor(
      (this.config.maxMemoryMB * 1024 * 1024) / avgRowSizeBytes
    );
    recommendedSize = Math.min(recommendedSize, memoryConstrainedSize);
    
    // Apply min/max bounds
    recommendedSize = Math.max(recommendedSize, this.config.minBatchSize);
    recommendedSize = Math.min(recommendedSize, this.config.maxBatchSize);
    
    // Calculate confidence based on history size
    let confidence: 'low' | 'medium' | 'high';
    if (history.length < 3) {
      confidence = 'low';
    } else if (history.length < 10) {
      confidence = 'medium';
    } else {
      confidence = 'high';
    }
    
    // Calculate estimates
    const estimatedTimeMs = recommendedSize * avgTimePerRow;
    const estimatedMemoryMB = (recommendedSize * avgRowSizeBytes) / (1024 * 1024);
    
    return {
      recommendedBatchSize: recommendedSize,
      confidence,
      reason: this.getRecommendationReason(lastBatchTimeMs),
      estimatedTimeMs,
      estimatedMemoryMB,
    };
  }
  
  /**
   * Record batch result for learning
   */
  recordBatchResult(result: BatchResult): void {
    const history = this.batchHistory.get(result.tableName) || [];
    
    // Keep last 20 results per table
    if (history.length >= 20) {
      history.shift();
    }
    
    history.push(result);
    this.batchHistory.set(result.tableName, history);
    
    // Update average row size
    if (result.rowCount > 0) {
      this.tableRowSizes.set(result.tableName, result.avgRowSizeBytes);
    }
  }
  
  /**
   * Get average row size for a table
   */
  getAverageRowSize(tableName: string): number | null {
    return this.tableRowSizes.get(tableName) || null;
  }
  
  /**
   * Get batch performance stats for a table
   */
  getBatchStats(tableName: string): {
    avgDurationMs: number;
    avgRowsPerSecond: number;
    successRate: number;
    totalBatches: number;
  } | null {
    const history = this.batchHistory.get(tableName);
    
    if (!history || history.length === 0) {
      return null;
    }
    
    const totalBatches = history.length;
    const successfulBatches = history.filter((r) => r.success);
    
    const avgDurationMs = history.reduce((sum, r) => sum + r.durationMs, 0) / totalBatches;
    const avgRowsPerSecond = history.reduce((sum, r) => {
      return sum + (r.rowCount / (r.durationMs / 1000));
    }, 0) / totalBatches;
    
    return {
      avgDurationMs,
      avgRowsPerSecond,
      successRate: successfulBatches.length / totalBatches,
      totalBatches,
    };
  }
  
  /**
   * Clear history for a table
   */
  clearHistory(tableName?: string): void {
    if (tableName) {
      this.batchHistory.delete(tableName);
      this.tableRowSizes.delete(tableName);
    } else {
      this.batchHistory.clear();
      this.tableRowSizes.clear();
    }
  }
  
  /**
   * Get recommendation reason based on performance
   */
  private getRecommendationReason(lastBatchTimeMs?: number): string {
    if (lastBatchTimeMs === undefined) {
      return 'Based on historical performance';
    }
    
    if (lastBatchTimeMs < this.config.targetBatchTimeMs * 0.5) {
      return 'Increased batch size due to fast processing';
    } else if (lastBatchTimeMs > this.config.targetBatchTimeMs * 1.5) {
      return 'Decreased batch size due to slow processing';
    }
    
    return 'Optimal batch size for target processing time';
  }
  
  /**
   * Estimate row size from sample data
   */
  static estimateRowSize(sampleRows: Record<string, unknown>[]): number {
    if (sampleRows.length === 0) {
      return 1024; // Default 1KB per row
    }
    
    const totalSize = sampleRows.reduce((sum, row) => {
      return sum + JSON.stringify(row).length;
    }, 0);
    
    return Math.ceil(totalSize / sampleRows.length);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let batchOptimizerInstance: BatchOptimizer | null = null;

/**
 * Get or create batch optimizer instance
 */
export function getBatchOptimizer(config?: Partial<BatchConfig>): BatchOptimizer {
  if (!batchOptimizerInstance) {
    batchOptimizerInstance = new BatchOptimizer(config);
  }
  return batchOptimizerInstance;
}

/**
 * Reset batch optimizer instance
 */
export function resetBatchOptimizer(): void {
  batchOptimizerInstance = null;
}


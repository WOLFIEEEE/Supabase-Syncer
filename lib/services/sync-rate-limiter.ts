/**
 * Sync Rate Limiter Service
 * 
 * Implements token bucket rate limiting for database operations
 * with adaptive throttling based on target database performance.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RateLimitConfig {
  maxOpsPerSecond: number;
  maxBytesPerSecond: number;
  burstMultiplier: number;
  adaptiveThrottling: boolean;
  slowResponseThresholdMs: number;
  fastResponseThresholdMs: number;
}

export interface RateLimitStats {
  currentRate: number;
  maxRate: number;
  throttled: boolean;
  throttleReason?: string;
  avgResponseTimeMs: number;
  totalOperations: number;
  totalThrottledMs: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: RateLimitConfig = {
  maxOpsPerSecond: 1000,
  maxBytesPerSecond: 10 * 1024 * 1024, // 10 MB/s
  burstMultiplier: 1.5,
  adaptiveThrottling: true,
  slowResponseThresholdMs: 500,
  fastResponseThresholdMs: 100,
};

// ============================================================================
// TOKEN BUCKET CLASS
// ============================================================================

class TokenBucket {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: number;
  
  constructor(maxTokens: number, refillRate: number) {
    this.tokens = maxTokens;
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }
  
  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const newTokens = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }
  
  /**
   * Try to consume tokens
   */
  tryConsume(count: number): boolean {
    this.refill();
    
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    
    return false;
  }
  
  /**
   * Get time until tokens are available
   */
  getWaitTime(count: number): number {
    this.refill();
    
    if (this.tokens >= count) {
      return 0;
    }
    
    const needed = count - this.tokens;
    return (needed / this.refillRate) * 1000; // milliseconds
  }
  
  /**
   * Get current token count
   */
  getTokens(): number {
    this.refill();
    return this.tokens;
  }
  
  /**
   * Update max tokens and refill rate
   */
  updateLimits(maxTokens: number, refillRate: number): void {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.tokens = Math.min(this.tokens, maxTokens);
  }
}

// ============================================================================
// MOVING AVERAGE CLASS
// ============================================================================

class MovingAverage {
  private values: number[] = [];
  private maxSize: number;
  
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }
  
  add(value: number): void {
    this.values.push(value);
    if (this.values.length > this.maxSize) {
      this.values.shift();
    }
  }
  
  getAverage(): number {
    if (this.values.length === 0) return 0;
    return this.values.reduce((a, b) => a + b, 0) / this.values.length;
  }
  
  getCount(): number {
    return this.values.length;
  }
  
  clear(): void {
    this.values = [];
  }
}

// ============================================================================
// SYNC RATE LIMITER CLASS
// ============================================================================

export class SyncRateLimiter {
  private config: RateLimitConfig;
  private opsBucket: TokenBucket;
  private bytesBucket: TokenBucket;
  private responseTimeTracker: MovingAverage;
  private currentThrottle: number = 1.0; // 1.0 = no throttle
  private totalOperations: number = 0;
  private totalThrottledMs: number = 0;
  private throttled: boolean = false;
  private throttleReason?: string;
  
  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize token buckets
    const burstOps = Math.floor(this.config.maxOpsPerSecond * this.config.burstMultiplier);
    const burstBytes = Math.floor(this.config.maxBytesPerSecond * this.config.burstMultiplier);
    
    this.opsBucket = new TokenBucket(burstOps, this.config.maxOpsPerSecond);
    this.bytesBucket = new TokenBucket(burstBytes, this.config.maxBytesPerSecond);
    this.responseTimeTracker = new MovingAverage(100);
  }
  
  /**
   * Acquire permit for operations
   */
  async acquirePermit(operationCount: number, byteCount: number = 0): Promise<void> {
    // Apply throttle
    const effectiveOps = Math.ceil(operationCount / this.currentThrottle);
    const effectiveBytes = Math.ceil(byteCount / this.currentThrottle);
    
    // Try to consume tokens
    let waitTime = 0;
    
    // Check operations bucket
    if (!this.opsBucket.tryConsume(effectiveOps)) {
      waitTime = Math.max(waitTime, this.opsBucket.getWaitTime(effectiveOps));
    }
    
    // Check bytes bucket if byte count provided
    if (byteCount > 0 && !this.bytesBucket.tryConsume(effectiveBytes)) {
      waitTime = Math.max(waitTime, this.bytesBucket.getWaitTime(effectiveBytes));
    }
    
    // Wait if needed
    if (waitTime > 0) {
      this.throttled = true;
      this.throttleReason = 'Rate limit exceeded';
      this.totalThrottledMs += waitTime;
      
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      
      // Consume tokens after waiting
      this.opsBucket.tryConsume(effectiveOps);
      if (byteCount > 0) {
        this.bytesBucket.tryConsume(effectiveBytes);
      }
    } else {
      this.throttled = false;
      this.throttleReason = undefined;
    }
    
    this.totalOperations += operationCount;
  }
  
  /**
   * Record operation response time for adaptive throttling
   */
  recordResponseTime(responseTimeMs: number): void {
    this.responseTimeTracker.add(responseTimeMs);
    
    if (this.config.adaptiveThrottling) {
      this.adaptToPerformance();
    }
  }
  
  /**
   * Adapt rate limits based on target performance
   */
  private adaptToPerformance(): void {
    const avgResponseTime = this.responseTimeTracker.getAverage();
    
    if (avgResponseTime > this.config.slowResponseThresholdMs) {
      // Target is slow, reduce rate
      this.currentThrottle = Math.max(0.25, this.currentThrottle * 0.9);
      this.throttled = true;
      this.throttleReason = `Adaptive throttle: avg response time ${avgResponseTime.toFixed(0)}ms`;
      
      // Update bucket limits
      const throttledOps = Math.floor(this.config.maxOpsPerSecond * this.currentThrottle);
      const throttledBytes = Math.floor(this.config.maxBytesPerSecond * this.currentThrottle);
      
      this.opsBucket.updateLimits(
        Math.floor(throttledOps * this.config.burstMultiplier),
        throttledOps
      );
      this.bytesBucket.updateLimits(
        Math.floor(throttledBytes * this.config.burstMultiplier),
        throttledBytes
      );
      
    } else if (avgResponseTime < this.config.fastResponseThresholdMs && this.currentThrottle < 1.0) {
      // Target is fast, increase rate gradually
      this.currentThrottle = Math.min(1.0, this.currentThrottle * 1.1);
      
      if (this.currentThrottle >= 0.95) {
        this.currentThrottle = 1.0;
        this.throttled = false;
        this.throttleReason = undefined;
      }
      
      // Update bucket limits
      const throttledOps = Math.floor(this.config.maxOpsPerSecond * this.currentThrottle);
      const throttledBytes = Math.floor(this.config.maxBytesPerSecond * this.currentThrottle);
      
      this.opsBucket.updateLimits(
        Math.floor(throttledOps * this.config.burstMultiplier),
        throttledOps
      );
      this.bytesBucket.updateLimits(
        Math.floor(throttledBytes * this.config.burstMultiplier),
        throttledBytes
      );
    }
  }
  
  /**
   * Get current rate limit stats
   */
  getStats(): RateLimitStats {
    return {
      currentRate: Math.floor(this.config.maxOpsPerSecond * this.currentThrottle),
      maxRate: this.config.maxOpsPerSecond,
      throttled: this.throttled,
      throttleReason: this.throttleReason,
      avgResponseTimeMs: this.responseTimeTracker.getAverage(),
      totalOperations: this.totalOperations,
      totalThrottledMs: this.totalThrottledMs,
    };
  }
  
  /**
   * Check if currently throttled
   */
  isThrottled(): boolean {
    return this.throttled;
  }
  
  /**
   * Get current throttle factor (0.25 - 1.0)
   */
  getThrottleFactor(): number {
    return this.currentThrottle;
  }
  
  /**
   * Reset rate limiter state
   */
  reset(): void {
    const burstOps = Math.floor(this.config.maxOpsPerSecond * this.config.burstMultiplier);
    const burstBytes = Math.floor(this.config.maxBytesPerSecond * this.config.burstMultiplier);
    
    this.opsBucket = new TokenBucket(burstOps, this.config.maxOpsPerSecond);
    this.bytesBucket = new TokenBucket(burstBytes, this.config.maxBytesPerSecond);
    this.responseTimeTracker.clear();
    this.currentThrottle = 1.0;
    this.totalOperations = 0;
    this.totalThrottledMs = 0;
    this.throttled = false;
    this.throttleReason = undefined;
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
    this.reset();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let rateLimiterInstance: SyncRateLimiter | null = null;

/**
 * Get or create rate limiter instance
 */
export function getSyncRateLimiter(config?: Partial<RateLimitConfig>): SyncRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new SyncRateLimiter(config);
  }
  return rateLimiterInstance;
}

/**
 * Reset rate limiter instance
 */
export function resetSyncRateLimiter(): void {
  rateLimiterInstance = null;
}


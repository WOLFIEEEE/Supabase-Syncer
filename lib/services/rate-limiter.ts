/**
 * Rate Limiter Service
 * 
 * In-memory rate limiting using sliding window algorithm.
 * No external dependencies required.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
  requests: number[];
}

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
}

// Rate limit configurations
export const RATE_LIMITS = {
  // Read operations (GET requests)
  read: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 100,     // 100 requests per minute
  },
  // Write operations (POST, PUT, DELETE)
  write: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 20,      // 20 requests per minute
  },
  // Sync operations (more restrictive)
  sync: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 10,      // 10 sync operations per minute
  },
  // Auth operations (prevent brute force)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,          // 10 attempts per 15 minutes
  },
  // Public endpoints (health, status) - allow more but still limit
  public: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 60,      // 60 requests per minute (1/second average)
  },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

// Store for rate limit entries: Map<userId_type, entry>
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval (run every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * Start the cleanup timer to remove expired entries
 */
function startCleanup(): void {
  if (cleanupTimer) return;
  
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    const maxWindow = Math.max(...Object.values(RATE_LIMITS).map(r => r.windowMs));
    
    for (const [key, entry] of rateLimitStore.entries()) {
      // Remove entries older than the largest window
      if (now - entry.windowStart > maxWindow * 2) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  
  // Don't prevent Node.js from exiting
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

/**
 * Check if a request should be rate limited
 * 
 * @param identifier - User ID or IP address
 * @param type - Type of rate limit to apply
 * @returns Object with allowed status and metadata
 */
export function checkRateLimit(
  identifier: string,
  type: RateLimitType
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
} {
  startCleanup();
  
  const config = RATE_LIMITS[type];
  const key = `${identifier}_${type}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  if (!entry) {
    // First request
    entry = {
      count: 1,
      windowStart: now,
      requests: [now],
    };
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }
  
  // Clean up old requests outside the window (sliding window)
  const windowStart = now - config.windowMs;
  entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
  entry.count = entry.requests.length;
  
  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    const oldestRequest = entry.requests[0];
    const retryAfter = Math.ceil((oldestRequest + config.windowMs - now) / 1000);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestRequest + config.windowMs,
      retryAfter: Math.max(1, retryAfter),
    };
  }
  
  // Request allowed
  entry.requests.push(now);
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: now + config.windowMs,
  };
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(
  result: ReturnType<typeof checkRateLimit>,
  type: RateLimitType
): Record<string, string> {
  const config = RATE_LIMITS[type];
  
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
  };
  
  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = result.retryAfter.toString();
  }
  
  return headers;
}

/**
 * Reset rate limit for a specific identifier and type
 * Useful for testing or admin operations
 */
export function resetRateLimit(identifier: string, type?: RateLimitType): void {
  if (type) {
    rateLimitStore.delete(`${identifier}_${type}`);
  } else {
    // Reset all types for this identifier
    for (const t of Object.keys(RATE_LIMITS)) {
      rateLimitStore.delete(`${identifier}_${t}`);
    }
  }
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  identifier: string,
  type: RateLimitType
): {
  count: number;
  remaining: number;
  resetAt: number | null;
} {
  const config = RATE_LIMITS[type];
  const key = `${identifier}_${type}`;
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return {
      count: 0,
      remaining: config.maxRequests,
      resetAt: null,
    };
  }

  const now = Date.now();
  const windowStart = now - config.windowMs;
  const validRequests = entry.requests.filter(timestamp => timestamp > windowStart);

  return {
    count: validRequests.length,
    remaining: Math.max(0, config.maxRequests - validRequests.length),
    resetAt: validRequests.length > 0 ? validRequests[0] + config.windowMs : null,
  };
}

/**
 * Stop the cleanup timer - call this on graceful shutdown
 */
export function stopCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

/**
 * Clear all rate limit data - useful for testing and shutdown
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
  stopCleanup();
}

/**
 * Middleware-style rate limit checker for API routes
 */
export async function withRateLimit<T>(
  identifier: string,
  type: RateLimitType,
  handler: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: string; status: 429; headers: Record<string, string> }> {
  const result = checkRateLimit(identifier, type);
  
  if (!result.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
      status: 429,
      headers: createRateLimitHeaders(result, type),
    };
  }
  
  const data = await handler();
  return { success: true, data };
}





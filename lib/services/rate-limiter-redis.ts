/**
 * Redis-based Distributed Rate Limiter
 * 
 * Provides a distributed rate limiting solution using Redis with:
 * - Sliding window algorithm implemented with Lua scripts
 * - Automatic fallback to in-memory if Redis is unavailable
 * - Support for both user-based and IP-based rate limiting
 */

import IORedis from 'ioredis';
import { RATE_LIMITS, RateLimitType, checkRateLimit as checkInMemoryRateLimit, createRateLimitHeaders as createInMemoryHeaders } from './rate-limiter';

// ============================================================================
// REDIS CONNECTION
// ============================================================================

let redisClient: IORedis | null = null;
let redisAvailable = true;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

/**
 * Get or create Redis connection for rate limiting
 */
function getRedisClient(): IORedis | null {
  if (redisClient) return redisClient;
  
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  try {
    redisClient = new IORedis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      connectTimeout: 5000,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          redisAvailable = false;
          return null; // Stop retrying
        }
        return Math.min(times * 100, 1000);
      },
    });
    
    redisClient.on('error', () => {
      redisAvailable = false;
    });
    
    redisClient.on('ready', () => {
      redisAvailable = true;
    });
    
    return redisClient;
  } catch {
    redisAvailable = false;
    return null;
  }
}

/**
 * Check if Redis is available (with cached health check)
 */
async function isRedisAvailable(): Promise<boolean> {
  const now = Date.now();
  
  // Use cached result if recent
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return redisAvailable;
  }
  
  const client = getRedisClient();
  if (!client) {
    redisAvailable = false;
    lastHealthCheck = now;
    return false;
  }
  
  try {
    await client.ping();
    redisAvailable = true;
  } catch {
    redisAvailable = false;
  }
  
  lastHealthCheck = now;
  return redisAvailable;
}

// ============================================================================
// REDIS LUA SCRIPTS
// ============================================================================

// Sliding window rate limiter script
const RATE_LIMIT_SCRIPT = `
local key = KEYS[1]
local window = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local unique_id = ARGV[4]

-- Remove entries outside the window
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

-- Count current requests in window
local count = redis.call('ZCARD', key)

if count < limit then
  -- Add current request
  redis.call('ZADD', key, now, unique_id)
  -- Set expiry slightly longer than window
  redis.call('PEXPIRE', key, window + 1000)
  return {1, limit - count - 1, now + window, count + 1}
else
  -- Get the oldest entry to calculate retry time
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retry_at = window
  if oldest[2] then
    retry_at = tonumber(oldest[2]) + window
  end
  return {0, 0, retry_at, count}
end
`;

// Script SHA for caching
let scriptSha: string | null = null;

/**
 * Load and cache the Lua script
 */
async function loadScript(client: IORedis): Promise<string> {
  if (scriptSha) {
    try {
      // Verify script still exists using SCRIPT EXISTS command
      const exists = await client.call('SCRIPT', 'EXISTS', scriptSha) as number[];
      if (exists && exists[0]) return scriptSha;
    } catch {
      // Script no longer exists, reload it
    }
  }
  
  // Load the script using SCRIPT LOAD command
  scriptSha = await client.call('SCRIPT', 'LOAD', RATE_LIMIT_SCRIPT) as string;
  return scriptSha;
}

// ============================================================================
// RATE LIMIT CHECKING
// ============================================================================

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
  currentCount?: number;
  source: 'redis' | 'memory';
}

/**
 * Check rate limit using Redis (with fallback to in-memory)
 */
export async function checkDistributedRateLimit(
  identifier: string,
  type: RateLimitType
): Promise<RateLimitResult> {
  // Check if Redis is available
  const useRedis = await isRedisAvailable();
  
  if (!useRedis) {
    // Fallback to in-memory rate limiting
    const result = checkInMemoryRateLimit(identifier, type);
    return { ...result, source: 'memory' };
  }
  
  const client = getRedisClient();
  if (!client) {
    const result = checkInMemoryRateLimit(identifier, type);
    return { ...result, source: 'memory' };
  }
  
  const config = RATE_LIMITS[type];
  const key = `ratelimit:${type}:${identifier}`;
  const now = Date.now();
  const uniqueId = `${now}-${Math.random().toString(36).substring(7)}`;
  
  try {
    // Load and execute the Lua script
    const sha = await loadScript(client);
    
    const result = await client.evalsha(
      sha,
      1,
      key,
      config.windowMs.toString(),
      config.maxRequests.toString(),
      now.toString(),
      uniqueId
    ) as [number, number, number, number];
    
    const [allowed, remaining, resetAt, currentCount] = result;
    
    if (allowed) {
      return {
        allowed: true,
        remaining,
        resetAt,
        currentCount,
        source: 'redis',
      };
    } else {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil((resetAt - now) / 1000),
        currentCount,
        source: 'redis',
      };
    }
  } catch (error) {
    console.error('Redis rate limit error, falling back to in-memory:', error);
    redisAvailable = false;
    
    // Fallback to in-memory
    const result = checkInMemoryRateLimit(identifier, type);
    return { ...result, source: 'memory' };
  }
}

// ============================================================================
// IP-BASED RATE LIMITING
// ============================================================================

/**
 * Extract client IP from request headers
 */
export function extractClientIP(headers: Headers): string {
  // Check standard proxy headers in order of preference
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP (original client)
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    if (ips[0]) return ips[0];
  }
  
  const realIP = headers.get('x-real-ip');
  if (realIP) return realIP;
  
  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;
  
  // Fallback for development
  return '127.0.0.1';
}

/**
 * Check rate limit for both user and IP
 */
export async function checkCombinedRateLimit(
  userId: string | null,
  ip: string,
  type: RateLimitType
): Promise<RateLimitResult> {
  // Check IP rate limit (always applies)
  const ipResult = await checkDistributedRateLimit(`ip:${ip}`, type);
  
  // If IP is rate limited, return immediately
  if (!ipResult.allowed) {
    return ipResult;
  }
  
  // If user is authenticated, also check user rate limit
  if (userId) {
    const userResult = await checkDistributedRateLimit(`user:${userId}`, type);
    
    // Return the more restrictive result
    if (!userResult.allowed) {
      return userResult;
    }
    
    // Return result with lower remaining count
    if (userResult.remaining < ipResult.remaining) {
      return userResult;
    }
  }
  
  return ipResult;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create rate limit headers for response
 */
export function createDistributedRateLimitHeaders(
  result: RateLimitResult,
  type: RateLimitType
): Record<string, string> {
  const config = RATE_LIMITS[type];
  
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
    'X-RateLimit-Source': result.source,
  };
  
  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }
  
  return headers;
}

/**
 * Reset rate limit for a specific identifier (for testing/admin)
 */
export async function resetRateLimit(
  identifier: string,
  type: RateLimitType
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;
  
  const key = `ratelimit:${type}:${identifier}`;
  
  try {
    await client.del(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  identifier: string,
  type: RateLimitType
): Promise<{ count: number; windowStart: number } | null> {
  const client = getRedisClient();
  if (!client) return null;
  
  const key = `ratelimit:${type}:${identifier}`;
  const now = Date.now();
  const config = RATE_LIMITS[type];
  
  try {
    // Remove old entries first
    await client.zremrangebyscore(key, 0, now - config.windowMs);
    
    // Get count
    const count = await client.zcard(key);
    
    // Get oldest entry for window start
    const oldest = await client.zrange(key, 0, 0, 'WITHSCORES');
    const windowStart = oldest.length >= 2 ? parseInt(oldest[1], 10) : now;
    
    return { count, windowStart };
  } catch {
    return null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Re-export the in-memory functions for compatibility
export { createInMemoryHeaders as createRateLimitHeaders };
export { RATE_LIMITS } from './rate-limiter';
export type { RateLimitType } from './rate-limiter';


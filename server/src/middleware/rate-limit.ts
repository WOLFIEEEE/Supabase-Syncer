/**
 * Redis-based Distributed Rate Limiting Middleware
 * 
 * Features:
 * - Sliding window algorithm with Redis sorted sets
 * - Per-user rate limiting using user ID from auth
 * - Configurable limits per endpoint type
 * - Automatic fallback to in-memory if Redis unavailable
 * - Standard rate limit headers in responses
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Redis } from 'ioredis';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

// Rate limit types
export type RateLimitType = 'sync' | 'schema' | 'execute' | 'read' | 'admin';

// Rate limit configuration
const RATE_LIMITS: Record<RateLimitType, { max: number; window: number }> = {
  sync: { max: config.rateLimitSync, window: 60000 },      // per minute
  schema: { max: config.rateLimitSchema, window: 60000 },
  execute: { max: config.rateLimitExecute, window: 60000 },
  read: { max: config.rateLimitRead, window: 60000 },
  admin: { max: config.rateLimitAdmin, window: 60000 },
};

// Redis client for rate limiting
let redisClient: Redis | null = null;
let redisAvailable = true;

// In-memory fallback store
const memoryStore = new Map<string, { count: number; resetTime: number }>();

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;
  
  try {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
    });
    
    redisClient.on('error', (err: Error) => {
      logger.warn({ err }, 'Redis rate limiter connection error');
      redisAvailable = false;
    });
    
    redisClient.on('ready', () => {
      redisAvailable = true;
    });
    
    return redisClient;
  } catch (error) {
    logger.warn({ error }, 'Failed to create Redis client for rate limiting');
    redisAvailable = false;
    return null;
  }
}

// Lua script for atomic rate limiting with sliding window
const RATE_LIMIT_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local max_requests = tonumber(ARGV[3])
local unique_id = ARGV[4]

-- Remove expired entries
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

-- Get current count
local count = redis.call('ZCARD', key)

if count < max_requests then
  -- Add new request
  redis.call('ZADD', key, now, unique_id)
  -- Set expiry
  redis.call('PEXPIRE', key, window + 1000)
  return {1, max_requests - count - 1, 0}
else
  -- Rate limited - calculate retry after
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local retry_after = 0
  if #oldest >= 2 then
    retry_after = math.ceil((tonumber(oldest[2]) + window - now) / 1000)
  end
  return {0, 0, retry_after}
end
`;

let scriptSha: string | null = null;

async function loadScript(client: Redis): Promise<string> {
  if (scriptSha) return scriptSha;
  scriptSha = await client.script('LOAD', RATE_LIMIT_SCRIPT) as string;
  return scriptSha;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
  limit: number;
  source: 'redis' | 'memory';
}

/**
 * Check rate limit for a user and endpoint type
 */
async function checkRateLimit(
  userId: string,
  type: RateLimitType
): Promise<RateLimitResult> {
  const limits = RATE_LIMITS[type];
  const key = `ratelimit:${type}:${userId}`;
  
  // Try Redis first
  if (redisAvailable) {
    const client = getRedisClient();
    if (client) {
      try {
        const sha = await loadScript(client);
        const now = Date.now();
        const uniqueId = `${now}-${Math.random().toString(36).substr(2, 9)}`;
        
        const result = await client.evalsha(
          sha,
          1,
          key,
          now.toString(),
          limits.window.toString(),
          limits.max.toString(),
          uniqueId
        ) as [number, number, number];
        
        return {
          allowed: result[0] === 1,
          remaining: result[1],
          retryAfter: result[2],
          limit: limits.max,
          source: 'redis',
        };
      } catch (error) {
        logger.warn({ error }, 'Redis rate limit error, falling back to memory');
        redisAvailable = false;
        // Reset script SHA in case Redis restarted
        scriptSha = null;
      }
    }
  }
  
  // Fallback to in-memory
  return checkMemoryRateLimit(key, limits.max, limits.window);
}

function checkMemoryRateLimit(
  key: string,
  max: number,
  window: number
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);
  
  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    cleanupMemoryStore();
  }
  
  if (!entry || now > entry.resetTime) {
    // New window
    memoryStore.set(key, { count: 1, resetTime: now + window });
    return {
      allowed: true,
      remaining: max - 1,
      retryAfter: 0,
      limit: max,
      source: 'memory',
    };
  }
  
  if (entry.count < max) {
    entry.count++;
    return {
      allowed: true,
      remaining: max - entry.count,
      retryAfter: 0,
      limit: max,
      source: 'memory',
    };
  }
  
  // Rate limited
  const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
  return {
    allowed: false,
    remaining: 0,
    retryAfter,
    limit: max,
    source: 'memory',
  };
}

function cleanupMemoryStore(): void {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (now > entry.resetTime) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Create rate limit headers
 */
function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + (result.retryAfter || 60)).toString(),
  };
}

// Extend FastifyRequest to include rate limit type
declare module 'fastify' {
  interface FastifyRequest {
    rateLimitType?: RateLimitType;
    userId?: string;
  }
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimitMiddleware(type: RateLimitType) {
  return async function rateLimitMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    // Get user ID from request (set by auth middleware)
    const userId = request.userId || request.headers['x-user-id'] as string || 'anonymous';
    
    const result = await checkRateLimit(userId, type);
    
    // Set rate limit headers
    const headers = createRateLimitHeaders(result);
    for (const [key, value] of Object.entries(headers)) {
      reply.header(key, value);
    }
    
    if (!result.allowed) {
      reply.header('Retry-After', result.retryAfter.toString());
      
      logger.warn({
        userId,
        type,
        retryAfter: result.retryAfter,
        source: result.source,
      }, 'Rate limit exceeded');
      
      return reply.status(429).send({
        success: false,
        error: 'Too many requests',
        retryAfter: result.retryAfter,
        message: `Rate limit exceeded. Please wait ${result.retryAfter} seconds before trying again.`,
      });
    }
  };
}

/**
 * Register rate limiting plugin
 */
export async function registerRateLimiting(fastify: FastifyInstance): Promise<void> {
  // Initialize Redis client
  getRedisClient();
  
  // Add decorator to set rate limit type on routes
  fastify.decorateRequest('rateLimitType', undefined);
  fastify.decorateRequest('userId', undefined);
  
  logger.info('Rate limiting middleware registered');
}

/**
 * Close rate limit connections
 */
export async function closeRateLimitConnections(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
  memoryStore.clear();
}

export { checkRateLimit, createRateLimitHeaders, RATE_LIMITS };


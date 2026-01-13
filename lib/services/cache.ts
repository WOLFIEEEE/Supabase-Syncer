/**
 * Redis Caching Layer
 * 
 * Provides a caching layer for frequently accessed data.
 * Uses Redis when available, falls back to in-memory cache.
 */

import { Redis } from 'ioredis';

// Cache configuration
const DEFAULT_TTL = 60; // 60 seconds
const MAX_MEMORY_CACHE_SIZE = 1000;

// TTL presets for different data types
export const CACHE_TTL = {
  USER_SETTINGS: 300,      // 5 minutes
  FEATURE_FLAGS: 3600,     // 1 hour
  SCHEMA_METADATA: 600,    // 10 minutes
  CONNECTION_LIST: 30,     // 30 seconds
  HEALTH_STATUS: 10,       // 10 seconds
  VERSION_INFO: 3600,      // 1 hour
} as const;

// In-memory cache for fallback
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

// Redis client singleton
let redisClient: Redis | null = null;
let redisAvailable = false;

/**
 * Initialize Redis connection
 */
function getRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    return null;
  }
  
  if (!redisClient) {
    try {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 3) {
            redisAvailable = false;
            return null; // Stop retrying
          }
          return Math.min(times * 100, 1000);
        },
      });
      
      redisClient.on('connect', () => {
        redisAvailable = true;
        console.log('[Cache] Redis connected');
      });
      
      redisClient.on('error', (err) => {
        redisAvailable = false;
        console.warn('[Cache] Redis error:', err.message);
      });
      
      redisClient.on('close', () => {
        redisAvailable = false;
      });
    } catch (error) {
      console.warn('[Cache] Failed to create Redis client:', error);
      return null;
    }
  }
  
  return redisClient;
}

/**
 * Clean up expired entries from memory cache
 */
function cleanMemoryCache(): void {
  const now = Date.now();
  const entries = Array.from(memoryCache.entries());
  for (const [key, entry] of entries) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
  
  // If still too large, remove oldest entries
  if (memoryCache.size > MAX_MEMORY_CACHE_SIZE) {
    const entries = Array.from(memoryCache.entries());
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    const toRemove = entries.slice(0, entries.length - MAX_MEMORY_CACHE_SIZE);
    for (const [key] of toRemove) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Get a value from cache
 */
async function getFromCache<T>(key: string): Promise<T | null> {
  // Try Redis first
  const redis = getRedisClient();
  if (redis && redisAvailable) {
    try {
      const value = await redis.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
    } catch (error) {
      console.warn('[Cache] Redis get error:', error);
    }
  }
  
  // Fall back to memory cache
  const entry = memoryCache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.value as T;
  }
  
  // Remove expired entry
  if (entry) {
    memoryCache.delete(key);
  }
  
  return null;
}

/**
 * Set a value in cache
 */
async function setInCache<T>(key: string, value: T, ttl: number): Promise<void> {
  // Try Redis first
  const redis = getRedisClient();
  if (redis && redisAvailable) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.warn('[Cache] Redis set error:', error);
    }
  }
  
  // Also set in memory cache as backup
  cleanMemoryCache();
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttl * 1000,
  });
}

/**
 * Delete a value from cache
 */
async function deleteFromCache(key: string): Promise<void> {
  // Delete from Redis
  const redis = getRedisClient();
  if (redis && redisAvailable) {
    try {
      await redis.del(key);
    } catch (error) {
      console.warn('[Cache] Redis del error:', error);
    }
  }
  
  // Delete from memory cache
  memoryCache.delete(key);
}

/**
 * Delete all keys matching a pattern
 */
async function deleteByPattern(pattern: string): Promise<void> {
  // Delete from Redis
  const redis = getRedisClient();
  if (redis && redisAvailable) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.warn('[Cache] Redis pattern del error:', error);
    }
  }
  
  // Delete from memory cache
  const regex = new RegExp(pattern.replace(/\*/g, '.*'));
  const keys = Array.from(memoryCache.keys());
  for (const key of keys) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Get cached data or fetch it
 * 
 * @param key Cache key
 * @param fetcher Function to fetch data if not cached
 * @param ttl Time to live in seconds
 * @returns Cached or fetched data
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  // Check if caching is enabled
  if (process.env.ENABLE_CACHING === 'false') {
    return fetcher();
  }
  
  // Try to get from cache
  const cached = await getFromCache<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch fresh data
  const data = await fetcher();
  
  // Store in cache
  await setInCache(key, data, ttl);
  
  return data;
}

/**
 * Invalidate cache for a specific key
 */
export async function invalidateCache(key: string): Promise<void> {
  await deleteFromCache(key);
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCacheByPattern(pattern: string): Promise<void> {
  await deleteByPattern(pattern);
}

/**
 * Cache key generators for common use cases
 */
export const cacheKeys = {
  userSettings: (userId: string) => `user:${userId}:settings`,
  userConnections: (userId: string) => `user:${userId}:connections`,
  connectionSchema: (connectionId: string) => `connection:${connectionId}:schema`,
  tableMetadata: (connectionId: string, table: string) => `connection:${connectionId}:table:${table}`,
  featureFlags: () => 'global:features',
  version: () => 'global:version',
  healthStatus: () => 'global:health',
};

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  memorySize: number;
  redisAvailable: boolean;
} {
  return {
    memorySize: memoryCache.size,
    redisAvailable,
  };
}

/**
 * Clear all cache (for testing/debugging)
 */
export async function clearAllCache(): Promise<void> {
  memoryCache.clear();
  
  const redis = getRedisClient();
  if (redis && redisAvailable) {
    try {
      await redis.flushdb();
    } catch (error) {
      console.warn('[Cache] Redis flush error:', error);
    }
  }
}

/**
 * Close Redis connection (for graceful shutdown)
 */
export async function closeCache(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    redisAvailable = false;
  }
}

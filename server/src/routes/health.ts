/**
 * Health Check Routes
 * 
 * Provides health check endpoints for load balancers and monitoring:
 * - GET /health - Full health check with dependency status
 * - GET /health/live - Liveness probe (is process running?)
 * - GET /health/ready - Readiness probe (ready to accept traffic?)
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Redis } from 'ioredis';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

interface HealthCheckResult {
  status: 'up' | 'down';
  latency?: number;
  error?: string;
  details?: Record<string, unknown>;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  checks: {
    redis: HealthCheckResult;
    database: HealthCheckResult;
    queue?: HealthCheckResult;
  };
}

// Track server start time
const startTime = Date.now();

// Redis client for health checks (lazy initialized)
let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    // Parse the Redis URL to handle TLS connections properly
    try {
      const url = new URL(config.redisUrl);
      const isTls = url.protocol === 'rediss:';

      redisClient = new Redis({
        host: url.hostname,
        port: parseInt(url.port || '6379', 10),
        password: url.password || undefined,
        tls: isTls ? { rejectUnauthorized: false } : undefined,
        maxRetriesPerRequest: 1,
        connectTimeout: 5000,
        lazyConnect: true,
      });
    } catch (error) {
      // Fallback to simple URL string if parsing fails
      logger.warn({ error }, 'Failed to parse Redis URL, using direct connection');
      redisClient = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 5000,
        lazyConnect: true,
      });
    }
  }
  return redisClient;
}

async function checkRedis(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const redis = getRedisClient();
    await redis.ping();
    return {
      status: 'up',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();

  // If no database URL configured, report as not configured (but not down)
  if (!config.databaseUrl) {
    return {
      status: 'up',
      latency: 0,
      details: { configured: false, message: 'Using Supabase directly' },
    };
  }

  try {
    // Dynamic import to avoid loading postgres if not needed
    const postgres = await import('postgres');
    const sql = postgres.default(config.databaseUrl, {
      max: 1,
      idle_timeout: 5,
      connect_timeout: 5,
    });

    await sql`SELECT 1`;
    await sql.end();

    return {
      status: 'up',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkQueue(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const redis = getRedisClient();

    // Check queue metrics
    const waitingCount = await redis.llen('bull:sync-jobs:wait') || 0;
    const activeCount = await redis.llen('bull:sync-jobs:active') || 0;

    return {
      status: 'up',
      latency: Date.now() - start,
      details: {
        jobs_waiting: waitingCount,
        jobs_active: activeCount,
      },
    };
  } catch (error) {
    return {
      status: 'down',
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function healthRoutes(fastify: FastifyInstance) {
  // Full health check
  fastify.get('/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    const [redisCheck, dbCheck, queueCheck] = await Promise.all([
      checkRedis(),
      checkDatabase(),
      checkQueue(),
    ]);

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (redisCheck.status === 'down') {
      status = 'unhealthy'; // Redis is critical
    } else if (dbCheck.status === 'down') {
      status = 'degraded'; // Database issues are degraded if Redis is up
    }

    const response: HealthResponse = {
      status,
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
      checks: {
        redis: redisCheck,
        database: dbCheck,
        queue: queueCheck,
      },
    };

    const statusCode = status === 'unhealthy' ? 503 : 200;
    return reply.status(statusCode).send(response);
  });

  // Liveness probe - just checks if process is running
  fastify.get('/health/live', async (_request: FastifyRequest, reply: FastifyReply) => {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const usagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

    // Log memory usage if it's high (but don't fail the health check)
    if (usagePercent > 90) {
      logger.warn({
        heapTotal: heapTotalMB,
        heapUsed: heapUsedMB,
        rss: Math.round(memUsage.rss / 1024 / 1024),
        usagePercent,
      }, 'High memory usage detected in health check');
    }

    return reply.status(200).send({
      status: 'alive',
      timestamp: new Date().toISOString(),
      memory: {
        heapUsed: heapUsedMB,
        heapTotal: heapTotalMB,
        usagePercent,
      },
    });
  });

  // Readiness probe - checks if ready to accept traffic
  fastify.get('/health/ready', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check Redis (critical for rate limiting and queues)
      const redisCheck = await checkRedis();

      if (redisCheck.status === 'down') {
        logger.warn('Readiness check failed: Redis is down');
        return reply.status(503).send({
          status: 'not_ready',
          reason: 'Redis is unavailable',
          timestamp: new Date().toISOString(),
        });
      }

      return reply.status(200).send({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({ err: error }, 'Readiness check failed');
      return reply.status(503).send({
        status: 'not_ready',
        reason: 'Health check failed',
        timestamp: new Date().toISOString(),
      });
    }
  });
}

// Cleanup function for graceful shutdown
export async function closeHealthCheckConnections(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export default healthRoutes;


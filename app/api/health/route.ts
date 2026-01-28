/**
 * Health Check Endpoint
 *
 * Provides detailed health status including:
 * - Database connectivity
 * - Backend server status
 * - Redis connectivity
 * - Memory usage
 * - Uptime
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Redis } from 'ioredis';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/services/rate-limiter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Track server start time for uptime calculation
const startTime = Date.now();

interface HealthCheck {
  status: 'ok' | 'error' | 'degraded' | 'unknown';
  latency?: number;
  message?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    supabase: HealthCheck;
    backend: HealthCheck;
    redis: HealthCheck;
    encryption: HealthCheck;
  };
  metrics: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

async function checkSupabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const supabase = await createClient();
    // Simple query to test connection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('connections')
      .select('id')
      .limit(1);
    
    const latency = Date.now() - start;
    
    if (error) {
      return {
        status: 'error',
        latency,
        message: error.message,
      };
    }
    
    return {
      status: 'ok',
      latency,
    };
  } catch (error) {
    return {
      status: 'error',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function checkBackend(): Promise<HealthCheck> {
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  
  if (!backendUrl) {
    return {
      status: 'unknown',
      message: 'Backend URL not configured',
    };
  }
  
  const start = Date.now();
  try {
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    const latency = Date.now() - start;
    
    if (!response.ok) {
      return {
        status: 'error',
        latency,
        message: `Status ${response.status}`,
      };
    }
    
    const data = await response.json();
    
    return {
      status: data.status === 'healthy' ? 'ok' : 'degraded',
      latency,
    };
  } catch (error) {
    return {
      status: 'error',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

async function checkRedis(): Promise<HealthCheck> {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    return {
      status: 'unknown',
      message: 'Redis URL not configured',
    };
  }
  
  const start = Date.now();
  let redis: Redis | null = null;
  
  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      lazyConnect: true,
    });
    
    await redis.ping();
    const latency = Date.now() - start;
    
    return {
      status: 'ok',
      latency,
      message: 'Redis connected',
    };
  } catch (error) {
    const latency = Date.now() - start;
    return {
      status: 'error',
      latency,
      message: error instanceof Error ? error.message : 'Redis connection failed',
    };
  } finally {
    if (redis) {
      try {
        await redis.quit();
      } catch {
        // Ignore quit errors during cleanup
      }
    }
  }
}

function checkEncryption(): HealthCheck {
  if (!process.env.ENCRYPTION_KEY) {
    return {
      status: 'error',
      message: 'Encryption key not configured',
    };
  }
  
  if (process.env.ENCRYPTION_KEY.length < 32) {
    return {
      status: 'degraded',
      message: 'Encryption key should be at least 32 characters',
    };
  }
  
  return {
    status: 'ok',
  };
}

function getMemoryMetrics() {
  // Note: process.memoryUsage() is available in Node.js
  // In Edge runtime, this would need different handling
  try {
    const usage = process.memoryUsage();
    const totalMemory = usage.heapTotal;
    const usedMemory = usage.heapUsed;
    
    return {
      used: Math.round(usedMemory / 1024 / 1024), // MB
      total: Math.round(totalMemory / 1024 / 1024), // MB
      percentage: Math.round((usedMemory / totalMemory) * 100),
    };
  } catch {
    return {
      used: 0,
      total: 0,
      percentage: 0,
    };
  }
}

function determineOverallStatus(checks: HealthResponse['checks']): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(checks).map(c => c.status);
  
  // If any critical check is error, overall is unhealthy
  if (checks.supabase.status === 'error' || checks.encryption.status === 'error') {
    return 'unhealthy';
  }
  
  // If any check is error or degraded, overall is degraded
  if (statuses.includes('error') || statuses.includes('degraded')) {
    return 'degraded';
  }
  
  return 'healthy';
}

export async function GET(request: NextRequest) {
  // Rate limit by IP to prevent abuse
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown';
  const rateLimitResult = checkRateLimit(ip, 'public');

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        status: 'error',
        message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
      },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimitResult, 'public'),
      }
    );
  }

  try {
    // Run all checks in parallel
    const [supabaseCheck, backendCheck, redisCheck] = await Promise.all([
      checkSupabase(),
      checkBackend(),
      checkRedis(),
    ]);
    
    const encryptionCheck = checkEncryption();
    
    const checks = {
      supabase: supabaseCheck,
      backend: backendCheck,
      redis: redisCheck,
      encryption: encryptionCheck,
    };
    
    const response: HealthResponse = {
      status: determineOverallStatus(checks),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.round((Date.now() - startTime) / 1000), // seconds
      checks,
      metrics: {
        memory: getMemoryMetrics(),
      },
    };
    
    // Return appropriate HTTP status for monitoring systems
    // 200 = healthy, 207 = degraded (partial success), 503 = unhealthy
    const httpStatus = response.status === 'healthy' ? 200 :
                       response.status === 'degraded' ? 207 : 503;
    
    return NextResponse.json(response, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: Math.round((Date.now() - startTime) / 1000),
        checks: {
          supabase: { status: 'error', message: 'Check failed' },
          backend: { status: 'unknown' },
          redis: { status: 'unknown' },
          encryption: { status: 'unknown' },
        },
        metrics: {
          memory: getMemoryMetrics(),
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

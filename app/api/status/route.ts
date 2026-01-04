import { NextResponse } from 'next/server';
import { connectionStore } from '@/lib/db/memory-store';

// Track server start time for uptime
const serverStartTime = Date.now();

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

async function checkDatabase(): Promise<{ status: string; message: string; type: string }> {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return {
      status: 'not_configured',
      message: 'Using in-memory storage. Data will be lost on restart.',
      type: 'In-Memory',
    };
  }

  try {
    // Try to import and use the database client
    const { db } = await import('@/lib/db/client');
    if (db) {
      return {
        status: 'connected',
        message: 'Persistent database connected',
        type: 'PostgreSQL',
      };
    }
    return {
      status: 'error',
      message: 'Database client not initialized',
      type: 'PostgreSQL',
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to connect',
      type: 'PostgreSQL',
    };
  }
}

async function checkRedis(): Promise<{ status: string; message: string }> {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    return {
      status: 'not_configured',
      message: 'Sync jobs run in real-time (blocking). Add REDIS_URL for background processing.',
    };
  }

  try {
    // Try to connect to Redis
    const Redis = (await import('ioredis')).default;
    const redis = new Redis(redisUrl, { 
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
    });
    
    await redis.connect();
    await redis.ping();
    await redis.quit();
    
    return {
      status: 'connected',
      message: 'Redis connected. Background job processing enabled.',
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to connect to Redis',
    };
  }
}

function checkEncryption(): { status: string; message: string } {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    return {
      status: 'error',
      message: 'ENCRYPTION_KEY not set. Database URLs cannot be securely stored.',
    };
  }

  if (encryptionKey.length < 32) {
    return {
      status: 'error',
      message: 'ENCRYPTION_KEY must be at least 32 characters.',
    };
  }

  return {
    status: 'ok',
    message: 'AES-256-GCM encryption configured',
  };
}

function checkSession(): { status: string; message: string } {
  const sessionSecret = process.env.SESSION_SECRET;
  
  if (!sessionSecret) {
    return {
      status: 'error',
      message: 'SESSION_SECRET not set. Authentication will not work.',
    };
  }

  if (sessionSecret.length < 32) {
    return {
      status: 'error',
      message: 'SESSION_SECRET should be at least 32 characters.',
    };
  }

  return {
    status: 'ok',
    message: 'Session security configured',
  };
}

function getConnectionStats() {
  const connections = connectionStore.getAll();
  return {
    total: connections.length,
    production: connections.filter(c => c.environment === 'production').length,
    development: connections.filter(c => c.environment === 'development').length,
  };
}

/**
 * GET /api/status
 * 
 * Returns system health status including:
 * - Application status
 * - Database connectivity
 * - Redis connectivity
 * - Encryption configuration
 * - Session configuration
 * - Connection statistics
 */
export async function GET() {
  try {
    const [database, redis] = await Promise.all([
      checkDatabase(),
      checkRedis(),
    ]);

    const encryption = checkEncryption();
    const session = checkSession();
    const connections = getConnectionStats();

    const uptime = Date.now() - serverStartTime;

    // Determine overall application status
    const hasErrors = 
      encryption.status === 'error' || 
      session.status === 'error' ||
      database.status === 'error' ||
      redis.status === 'error';

    return NextResponse.json({
      success: true,
      data: {
        application: {
          status: hasErrors ? 'error' : 'ok',
          version: '1.0.0',
          uptime: formatUptime(uptime),
        },
        database,
        redis,
        encryption,
        session,
        connections,
      },
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check system status',
    }, { status: 500 });
  }
}


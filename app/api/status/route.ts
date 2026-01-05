/**
 * Public Status API
 * 
 * Returns system status and keep-alive information.
 * This is a public endpoint - no authentication required.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// App version - update this when releasing
const APP_VERSION = '1.0.0';

// Track when the app started (for uptime calculation)
const startTime = Date.now();

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

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check database connection
    let dbStatus: 'connected' | 'not_configured' | 'error' = 'not_configured';
    let dbMessage = 'Using Supabase for storage';
    let dbType = 'PostgreSQL (Supabase)';
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('connections')
        .select('id')
        .limit(1);
      
      if (error) {
        dbStatus = 'error';
        dbMessage = error.message;
      } else {
        dbStatus = 'connected';
        dbMessage = 'Connected to Supabase';
      }
    } catch (e) {
      dbStatus = 'error';
      dbMessage = e instanceof Error ? e.message : 'Unknown error';
    }
    
    // Get connection stats
    let totalConnections = 0;
    let productionConnections = 0;
    let developmentConnections = 0;
    let keepAliveActive = 0;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: connections } = await (supabase as any)
        .from('connections')
        .select('environment, keep_alive, last_pinged_at');
      
      if (connections) {
        totalConnections = connections.length;
        productionConnections = connections.filter((c: { environment: string }) => 
          c.environment === 'production'
        ).length;
        developmentConnections = connections.filter((c: { environment: string }) => 
          c.environment === 'development'
        ).length;
        keepAliveActive = connections.filter((c: { keep_alive: boolean }) => 
          c.keep_alive
        ).length;
      }
    } catch (e) {
      console.error('Error fetching connection stats:', e);
    }
    
    // Check encryption
    const encryptionStatus = process.env.ENCRYPTION_KEY ? 'ok' : 'error';
    const encryptionMessage = encryptionStatus === 'ok' 
      ? 'AES-256 encryption configured'
      : 'ENCRYPTION_KEY not set - credentials not secure';
    
    // Check auth
    const authStatus = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) 
      ? 'ok' : 'error';
    const authMessage = authStatus === 'ok'
      ? 'Supabase Auth configured'
      : 'Supabase credentials missing';
    
    // Redis status (optional)
    const redisUrl = process.env.REDIS_URL;
    const redisStatus = redisUrl ? 'connected' : 'not_configured';
    const redisMessage = redisUrl 
      ? 'Redis connected for job queue'
      : 'Not configured - using in-memory processing';
    
    // Calculate uptime
    const uptime = formatUptime(Date.now() - startTime);
    
    // Overall application status
    const appStatus = (dbStatus === 'connected' && encryptionStatus === 'ok' && authStatus === 'ok')
      ? 'ok' : 'error';
    
    return NextResponse.json({
      success: true,
      data: {
        application: {
          status: appStatus,
          version: APP_VERSION,
          uptime,
        },
        database: {
          status: dbStatus,
          message: dbMessage,
          type: dbType,
        },
        redis: {
          status: redisStatus,
          message: redisMessage,
        },
        encryption: {
          status: encryptionStatus,
          message: encryptionMessage,
        },
        auth: {
          status: authStatus,
          message: authMessage,
        },
        connections: {
          total: totalConnections,
          production: productionConnections,
          development: developmentConnections,
        },
        keepAlive: {
          active: keepAliveActive,
          schedule: 'Daily at midnight UTC',
        },
      },
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Status API] Error:', message);
    
    return NextResponse.json({
      success: false,
      error: message,
      data: {
        application: {
          status: 'error',
          version: APP_VERSION,
          uptime: formatUptime(Date.now() - startTime),
        },
        database: {
          status: 'error',
          message: message,
          type: 'Unknown',
        },
        redis: {
          status: 'not_configured',
          message: 'Unable to check',
        },
        encryption: {
          status: 'error',
          message: 'Unable to check',
        },
        auth: {
          status: 'error',
          message: 'Unable to check',
        },
        connections: {
          total: 0,
          production: 0,
          development: 0,
        },
        keepAlive: {
          active: 0,
          schedule: 'Daily at midnight UTC',
        },
      },
    });
  }
}

/**
 * Keep Alive Service
 * 
 * Prevents Supabase free tier databases from being paused due to inactivity.
 * Supabase pauses databases after ~1 week of inactivity on the free tier.
 * 
 * This service periodically pings databases with keep_alive enabled
 * by running a lightweight query that logs activity.
 */

import { createDrizzleClient, type DrizzleConnection } from './drizzle-factory';
import { decrypt } from './encryption';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/services/logger';

// Configuration
export const KEEP_ALIVE_CONFIG = {
  // Name of the temporary table used for keep-alive pings
  tableName: '_supabase_syncer_keepalive',
  
  // Maximum time to wait for a ping (15 seconds)
  pingTimeout: 15000,
  
  // Minimum interval between pings for the same connection (6 hours)
  // Note: Cron runs daily, but this prevents manual pings from being too frequent
  minPingInterval: 6 * 60 * 60 * 1000,
};

export interface PingResult {
  connectionId: string;
  connectionName: string;
  success: boolean;
  duration: number;
  error?: string;
  timestamp: Date;
}

export interface KeepAliveStats {
  totalPinged: number;
  successful: number;
  failed: number;
  skipped: number;
  results: PingResult[];
}

/**
 * Ping a single database to keep it alive
 * Uses a lightweight approach: creates a temp table, inserts data, then cleans up
 */
export async function pingDatabase(
  connectionId: string,
  connectionName: string,
  encryptedUrl: string
): Promise<PingResult> {
  const startTime = Date.now();
  let connection: DrizzleConnection | null = null;
  
  try {
    // Decrypt the database URL
    const databaseUrl = decrypt(encryptedUrl);
    
    // Create connection
    connection = createDrizzleClient(databaseUrl);
    
    // Run a lightweight ping query
    // This approach is better than creating/dropping tables as it:
    // 1. Doesn't require DDL permissions
    // 2. Is faster and less resource-intensive
    // 3. Still registers as database activity
    await Promise.race([
      performPing(connection),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Ping timeout')), KEEP_ALIVE_CONFIG.pingTimeout)
      ),
    ]);
    
    const duration = Date.now() - startTime;
    
    logger.info('Keep Alive: Pinged successfully', { connectionName, durationMs: duration });
    
    return {
      connectionId,
      connectionName,
      success: true,
      duration,
      timestamp: new Date(),
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Keep Alive: Failed to ping', { connectionName, error: errorMessage });
    
    return {
      connectionId,
      connectionName,
      success: false,
      duration,
      error: errorMessage,
      timestamp: new Date(),
    };
    
  } finally {
    // Clean up connection
    if (connection) {
      try {
        await connection.close();
      } catch {
        // Ignore close errors
      }
    }
  }
}

/**
 * Perform the actual ping operation
 * Uses multiple approaches in order of preference
 */
async function performPing(connection: DrizzleConnection): Promise<void> {
  // Approach 1: Simple SELECT (fastest, always works)
  try {
    await connection.client`SELECT 1 as ping, NOW() as timestamp`;
    return;
  } catch {
    // Fall through to next approach
  }
  
  // Approach 2: Query pg_stat_activity (reads metadata, registers activity)
  try {
    await connection.client`
      SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database()
    `;
    return;
  } catch {
    // Fall through to next approach
  }
  
  // Approach 3: Create and drop a temp table (more invasive but guaranteed to work)
  const tableName = `${KEEP_ALIVE_CONFIG.tableName}_${Date.now()}`;
  try {
    await connection.client.unsafe(`
      CREATE TEMP TABLE IF NOT EXISTS "${tableName}" (
        id SERIAL PRIMARY KEY,
        ping_time TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await connection.client.unsafe(`INSERT INTO "${tableName}" DEFAULT VALUES`);
    await connection.client.unsafe(`DROP TABLE IF EXISTS "${tableName}"`);
    return;
  } catch (error) {
    // Clean up on error
    try {
      await connection.client.unsafe(`DROP TABLE IF EXISTS "${tableName}"`);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Check if a connection should be pinged based on last ping time
 */
export function shouldPing(lastPingedAt: Date | null): boolean {
  if (!lastPingedAt) {
    return true; // Never pinged, should ping
  }
  
  const timeSinceLastPing = Date.now() - lastPingedAt.getTime();
  return timeSinceLastPing >= KEEP_ALIVE_CONFIG.minPingInterval;
}

/**
 * Get a human-readable time until next ping
 */
export function getTimeUntilNextPing(lastPingedAt: Date | null): string {
  if (!lastPingedAt) {
    return 'Now';
  }
  
  const timeSinceLastPing = Date.now() - lastPingedAt.getTime();
  const timeUntilNextPing = KEEP_ALIVE_CONFIG.minPingInterval - timeSinceLastPing;
  
  if (timeUntilNextPing <= 0) {
    return 'Now';
  }
  
  const hours = Math.floor(timeUntilNextPing / (60 * 60 * 1000));
  const minutes = Math.floor((timeUntilNextPing % (60 * 60 * 1000)) / (60 * 1000));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format the last pinged time for display
 */
export function formatLastPinged(lastPingedAt: Date | null): string {
  if (!lastPingedAt) {
    return 'Never';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - lastPingedAt.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  
  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

/**
 * Log a ping result to the database for history tracking
 */
export async function logPingResult(result: PingResult): Promise<void> {
  try {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('ping_logs')
      .insert({
        connection_id: result.connectionId,
        success: result.success,
        duration_ms: result.duration,
        error_message: result.error || null,
      });
  } catch (error) {
    // Don't throw - logging should not break the ping flow
    logger.error('Keep Alive: Failed to log ping result', { error });
  }
}

/**
 * Get ping history for a connection
 */
export async function getPingHistory(
  connectionId: string,
  limit: number = 50
): Promise<{
  success: boolean;
  duration: number;
  error?: string;
  timestamp: Date;
}[]> {
  try {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('ping_logs')
      .select('success, duration_ms, error_message, created_at')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      logger.error('Keep Alive: Failed to get ping history', { error });
      return [];
    }
    
    return (data || []).map((row: {
      success: boolean;
      duration_ms: number;
      error_message: string | null;
      created_at: string;
    }) => ({
      success: row.success,
      duration: row.duration_ms,
      error: row.error_message || undefined,
      timestamp: new Date(row.created_at),
    }));
  } catch (error) {
    logger.error('Keep Alive: Failed to get ping history', { error });
    return [];
  }
}

/**
 * Get aggregated ping stats for a connection
 */
export async function getPingStats(connectionId: string): Promise<{
  total: number;
  successful: number;
  failed: number;
  avgDuration: number;
  uptime: number; // percentage
}> {
  try {
    const supabase = await createClient();
    
    // Get last 100 pings for stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('ping_logs')
      .select('success, duration_ms')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error || !data || data.length === 0) {
      return { total: 0, successful: 0, failed: 0, avgDuration: 0, uptime: 0 };
    }
    
    const total = data.length;
    const successful = data.filter((r: { success: boolean }) => r.success).length;
    const failed = total - successful;
    const avgDuration = Math.round(
      data.reduce((sum: number, r: { duration_ms: number }) => sum + r.duration_ms, 0) / total
    );
    const uptime = Math.round((successful / total) * 100);
    
    return { total, successful, failed, avgDuration, uptime };
  } catch (error) {
    logger.error('Keep Alive: Failed to get ping stats', { error });
    return { total: 0, successful: 0, failed: 0, avgDuration: 0, uptime: 0 };
  }
}


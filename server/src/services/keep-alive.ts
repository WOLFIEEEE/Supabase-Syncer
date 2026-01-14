/**
 * Keep Alive Service (Backend)
 * 
 * Prevents Supabase free tier databases from being paused due to inactivity.
 * Supabase pauses databases after ~1 week of inactivity on the free tier.
 * 
 * This service periodically pings databases with keep_alive enabled
 * by running a lightweight query that logs activity.
 * 
 * This is the backend version that runs independently of the frontend.
 */

import { createDrizzleClient, type DrizzleConnection } from './drizzle-factory.js';
import { decrypt } from './encryption.js';
import { logger } from '../utils/logger.js';
import { getSupabaseClient, updateConnectionLastPinged } from './supabase-client.js';

// Configuration
export const KEEP_ALIVE_CONFIG = {
  // Name of the temporary table used for keep-alive pings
  tableName: '_supabase_syncer_keepalive',
  
  // Maximum time to wait for a ping (15 seconds)
  pingTimeout: 15000,
  
  // Minimum interval between pings for the same connection (6 hours)
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
 * Uses a lightweight approach: simple SELECT query, then fallback to temp table if needed
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
    
    // Run a lightweight ping query with timeout
    let timeoutId: NodeJS.Timeout | null = null;
    try {
      await Promise.race([
        performPing(connection),
        new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Ping timeout')), KEEP_ALIVE_CONFIG.pingTimeout);
        }),
      ]);
    } finally {
      // Always clear timeout to prevent memory leak
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
    
    const duration = Date.now() - startTime;
    
    logger.info({ connectionId, connectionName, duration }, 'Keep-alive ping successful');
    
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
    
    logger.warn({ error, connectionId, connectionName, duration }, 'Keep-alive ping failed');
    
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
        // Force garbage collection hint (if available)
        if (global.gc) {
          global.gc();
        }
      } catch (error) {
        logger.warn({ error, connectionId }, 'Error closing connection during cleanup');
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
 * Log a ping result to the database for history tracking
 */
export async function logPingResult(result: PingResult): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
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
    logger.warn({ error, connectionId: result.connectionId }, 'Failed to log ping result');
  }
}

/**
 * Update last_pinged_at timestamp for a connection
 * Re-exports the function from supabase-client for convenience
 */
export { updateConnectionLastPinged as updateLastPinged };

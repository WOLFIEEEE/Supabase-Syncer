/**
 * Scheduled Jobs Service
 * 
 * Handles periodic background tasks like keep-alive pings.
 * Runs independently of the frontend to ensure reliability.
 */

import { logger } from '../utils/logger.js';
import { getKeepAliveConnections, updateConnectionLastPinged } from './supabase-client.js';
import { pingDatabase, shouldPing, logPingResult, type KeepAliveStats } from './keep-alive.js';

let keepAliveInterval: NodeJS.Timeout | null = null;
let isRunning = false;

/**
 * Configuration for scheduled jobs
 */
const SCHEDULED_JOBS_CONFIG = {
  // Run keep-alive check every 6 hours
  keepAliveIntervalMs: 6 * 60 * 60 * 1000,
  
  // Initial delay before first run (5 minutes after server start)
  keepAliveInitialDelayMs: 5 * 60 * 1000,
};

/**
 * Run keep-alive ping cycle for all enabled connections
 */
async function runKeepAliveCycle(): Promise<void> {
  if (isRunning) {
    logger.debug('Keep-alive cycle already running, skipping');
    return;
  }

  isRunning = true;
  const startTime = Date.now();
  
  try {
    logger.info('Starting keep-alive ping cycle...');
    
    // Get all connections with keep_alive enabled
    const connections = await getKeepAliveConnections();
    
    logger.info({ count: connections.length }, 'Found connections with keep-alive enabled');
    
    if (connections.length === 0) {
      logger.debug('No connections with keep-alive enabled');
      return;
    }
    
    const stats: KeepAliveStats = {
      totalPinged: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      results: [],
    };
    
    // Process connections sequentially to avoid overwhelming resources
    for (const connection of connections) {
      try {
        // Parse last_pinged_at
        const lastPingedAt = connection.last_pinged_at 
          ? new Date(connection.last_pinged_at) 
          : null;
        
        // Check if we should ping based on last ping time
        if (!shouldPing(lastPingedAt)) {
          logger.debug({ connectionId: connection.id, connectionName: connection.name }, 
            'Skipping - recently pinged');
          stats.skipped++;
          continue;
        }
        
        stats.totalPinged++;
        
        // Ping the database
        const result = await pingDatabase(
          connection.id,
          connection.name,
          connection.encrypted_url
        );
        
        stats.results.push(result);
        
        // Log the ping result to history
        await logPingResult(result);
        
        if (result.success) {
          stats.successful++;
          
          // Update last_pinged_at timestamp
          const updateSuccess = await updateConnectionLastPinged(connection.id);
          if (!updateSuccess) {
            logger.warn({ connectionId: connection.id, connectionName: connection.name }, 
              'Ping succeeded but failed to update last_pinged_at timestamp');
          } else {
            logger.debug({ connectionId: connection.id, connectionName: connection.name }, 
              'Successfully updated last_pinged_at timestamp');
          }
        } else {
          stats.failed++;
        }
        
        // Small delay between pings to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        logger.error({ error, connectionId: connection.id }, 'Error pinging connection');
        stats.failed++;
      }
    }
    
    const duration = Date.now() - startTime;
    
    logger.info({
      successful: stats.successful,
      failed: stats.failed,
      skipped: stats.skipped,
      total: stats.totalPinged,
      duration,
    }, 'Keep-alive cycle completed');
    
  } catch (error) {
    logger.error({ error }, 'Error in keep-alive cycle');
  } finally {
    isRunning = false;
  }
}

/**
 * Start scheduled jobs
 */
export function startScheduledJobs(): void {
  if (keepAliveInterval) {
    logger.warn('Scheduled jobs already started');
    return;
  }
  
  logger.info('Starting scheduled jobs...');
  
  // Run initial keep-alive after initial delay
  setTimeout(() => {
    runKeepAliveCycle().catch((error) => {
      logger.error({ error }, 'Error in initial keep-alive cycle');
    });
  }, SCHEDULED_JOBS_CONFIG.keepAliveInitialDelayMs);
  
  // Then run every interval
  keepAliveInterval = setInterval(() => {
    runKeepAliveCycle().catch((error) => {
      logger.error({ error }, 'Error in scheduled keep-alive cycle');
    });
  }, SCHEDULED_JOBS_CONFIG.keepAliveIntervalMs);
  
  logger.info({
    keepAliveInterval: `${SCHEDULED_JOBS_CONFIG.keepAliveIntervalMs / 1000 / 60} minutes`,
    initialDelay: `${SCHEDULED_JOBS_CONFIG.keepAliveInitialDelayMs / 1000 / 60} minutes`,
  }, 'Scheduled jobs started');
}

/**
 * Stop scheduled jobs
 */
export function stopScheduledJobs(): void {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    logger.info('Scheduled jobs stopped');
  }
}

/**
 * Manually trigger keep-alive cycle (for testing/admin use)
 */
export async function triggerKeepAliveCycle(): Promise<KeepAliveStats> {
  const stats: KeepAliveStats = {
    totalPinged: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    results: [],
  };
  
  try {
    const connections = await getKeepAliveConnections();
    
    for (const connection of connections) {
      const lastPingedAt = connection.last_pinged_at 
        ? new Date(connection.last_pinged_at) 
        : null;
      
      if (!shouldPing(lastPingedAt)) {
        stats.skipped++;
        continue;
      }
      
      stats.totalPinged++;
      
      const result = await pingDatabase(
        connection.id,
        connection.name,
        connection.encrypted_url
      );
      
      stats.results.push(result);
      await logPingResult(result);
      
      if (result.success) {
        stats.successful++;
        
        // Update last_pinged_at timestamp
        const updateSuccess = await updateConnectionLastPinged(connection.id);
        if (!updateSuccess) {
          logger.warn({ connectionId: connection.id, connectionName: connection.name }, 
            'Ping succeeded but failed to update last_pinged_at timestamp');
        } else {
          logger.debug({ connectionId: connection.id, connectionName: connection.name }, 
            'Successfully updated last_pinged_at timestamp');
        }
      } else {
        stats.failed++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } catch (error) {
    logger.error({ error }, 'Error in manual keep-alive trigger');
  }
  
  return stats;
}

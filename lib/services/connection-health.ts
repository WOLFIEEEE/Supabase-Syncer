/**
 * Connection Health Monitoring Service
 * 
 * Provides background health checks for database connections
 * with status tracking and exponential backoff retry.
 */

import { testConnection } from './drizzle-factory';
import { decrypt } from './encryption';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface ConnectionHealthState {
  connectionId: string;
  status: HealthStatus;
  lastChecked: Date | null;
  lastHealthy: Date | null;
  responseTime: number | null; // in milliseconds
  error: string | null;
  consecutiveFailures: number;
  version: string | null;
  tableCount: number | null;
}

export interface HealthCheckResult {
  status: HealthStatus;
  responseTime: number;
  error: string | null;
  version: string | null;
  tableCount: number | null;
}

// Store health state in memory
const healthStore = new Map<string, ConnectionHealthState>();

// Backoff configuration
const BACKOFF_CONFIG = {
  initialDelay: 1000,      // 1 second
  maxDelay: 60000,         // 1 minute
  multiplier: 2,
  maxRetries: 5,
};

/**
 * Calculate backoff delay based on consecutive failures
 */
function calculateBackoff(failures: number): number {
  const delay = BACKOFF_CONFIG.initialDelay * Math.pow(BACKOFF_CONFIG.multiplier, failures);
  return Math.min(delay, BACKOFF_CONFIG.maxDelay);
}

/**
 * Get current health state for a connection
 */
export function getHealthState(connectionId: string): ConnectionHealthState {
  const existing = healthStore.get(connectionId);
  if (existing) {
    return existing;
  }
  
  // Return default state
  return {
    connectionId,
    status: 'unknown',
    lastChecked: null,
    lastHealthy: null,
    responseTime: null,
    error: null,
    consecutiveFailures: 0,
    version: null,
    tableCount: null,
  };
}

/**
 * Update health state
 */
function updateHealthState(connectionId: string, result: HealthCheckResult): ConnectionHealthState {
  const current = getHealthState(connectionId);
  const now = new Date();
  
  const newState: ConnectionHealthState = {
    connectionId,
    status: result.status,
    lastChecked: now,
    lastHealthy: result.status === 'healthy' ? now : current.lastHealthy,
    responseTime: result.responseTime,
    error: result.error,
    consecutiveFailures: result.status === 'healthy' ? 0 : current.consecutiveFailures + 1,
    version: result.version || current.version,
    tableCount: result.tableCount ?? current.tableCount,
  };
  
  healthStore.set(connectionId, newState);
  return newState;
}

/**
 * Perform health check on a connection
 */
export async function checkConnectionHealth(
  connectionId: string,
  encryptedUrl: string
): Promise<ConnectionHealthState> {
  const startTime = Date.now();
  
  try {
    const databaseUrl = decrypt(encryptedUrl);
    const result = await testConnection(databaseUrl);
    const responseTime = Date.now() - startTime;
    
    if (result.success) {
      // Determine health status based on response time
      let status: HealthStatus = 'healthy';
      if (responseTime > 5000) {
        status = 'degraded'; // Slow but working
      }
      
      return updateHealthState(connectionId, {
        status,
        responseTime,
        error: null,
        version: result.version,
        tableCount: result.tableCount,
      });
    } else {
      return updateHealthState(connectionId, {
        status: 'unhealthy',
        responseTime,
        error: result.error,
        version: null,
        tableCount: null,
      });
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return updateHealthState(connectionId, {
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      version: null,
      tableCount: null,
    });
  }
}

/**
 * Perform health check with retry and backoff
 */
export async function checkConnectionHealthWithRetry(
  connectionId: string,
  encryptedUrl: string,
  maxRetries: number = BACKOFF_CONFIG.maxRetries
): Promise<ConnectionHealthState> {
  let lastState = getHealthState(connectionId);
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    lastState = await checkConnectionHealth(connectionId, encryptedUrl);
    
    if (lastState.status === 'healthy' || lastState.status === 'degraded') {
      return lastState;
    }
    
    // Wait before retry with exponential backoff
    if (attempt < maxRetries) {
      const delay = calculateBackoff(attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return lastState;
}

/**
 * Check health for multiple connections
 */
export async function checkMultipleConnections(
  connections: Array<{ id: string; encryptedUrl: string }>
): Promise<Map<string, ConnectionHealthState>> {
  const results = new Map<string, ConnectionHealthState>();
  
  // Check all connections in parallel (with limit)
  const batchSize = 5;
  for (let i = 0; i < connections.length; i += batchSize) {
    const batch = connections.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(conn => checkConnectionHealth(conn.id, conn.encryptedUrl))
    );
    
    for (const state of batchResults) {
      results.set(state.connectionId, state);
    }
  }
  
  return results;
}

/**
 * Clear health state for a connection
 */
export function clearHealthState(connectionId: string): void {
  healthStore.delete(connectionId);
}

/**
 * Get all health states
 */
export function getAllHealthStates(): ConnectionHealthState[] {
  return Array.from(healthStore.values());
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'green';
    case 'degraded':
      return 'yellow';
    case 'unhealthy':
      return 'red';
    case 'unknown':
    default:
      return 'gray';
  }
}

/**
 * Get status label for UI
 */
export function getStatusLabel(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'Connected';
    case 'degraded':
      return 'Slow';
    case 'unhealthy':
      return 'Disconnected';
    case 'unknown':
    default:
      return 'Unknown';
  }
}

/**
 * Check if a health check is stale (older than 5 minutes)
 */
export function isHealthStale(state: ConnectionHealthState): boolean {
  if (!state.lastChecked) return true;
  const staleThreshold = 5 * 60 * 1000; // 5 minutes
  return Date.now() - state.lastChecked.getTime() > staleThreshold;
}


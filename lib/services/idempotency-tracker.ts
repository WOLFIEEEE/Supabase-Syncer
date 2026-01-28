/**
 * Idempotency Tracker Service
 * 
 * Tracks processed rows to ensure sync operations are idempotent.
 * Uses Redis as primary storage with database backup.
 */

import IORedis from 'ioredis';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/services/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface ProcessedRow {
  syncJobId: string;
  tableName: string;
  rowId: string;
  operation: 'insert' | 'update' | 'skip';
  batchId?: string;
  processedAt: Date;
}

export interface IdempotencyStats {
  totalProcessed: number;
  inserts: number;
  updates: number;
  skips: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const IDEMPOTENCY_CONFIG = {
  redisKeyPrefix: 'sync:idempotency:',
  redisExpireSeconds: 24 * 60 * 60, // 24 hours
  batchSize: 100,
  useRedis: true,
  useDatabase: true,
};

// ============================================================================
// REDIS CONNECTION
// ============================================================================

let redisClient: IORedis | null = null;

function getRedisClient(): IORedis | null {
  if (!IDEMPOTENCY_CONFIG.useRedis) {
    return null;
  }
  
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    try {
      redisClient = new IORedis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 100, 3000);
        },
        enableReadyCheck: true,
        lazyConnect: true,
      });
      
      redisClient.on('error', (err) => {
        logger.warn('Redis connection error (idempotency)', { error: err.message });
      });
    } catch (error) {
      logger.warn('Failed to create Redis client for idempotency', { error });
      return null;
    }
  }
  
  return redisClient;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate Redis key for a processed row
 */
function getRedisKey(syncJobId: string, tableName: string, rowId: string): string {
  return `${IDEMPOTENCY_CONFIG.redisKeyPrefix}${syncJobId}:${tableName}:${rowId}`;
}

/**
 * Generate Redis pattern for a sync job
 */
function getJobPattern(syncJobId: string): string {
  return `${IDEMPOTENCY_CONFIG.redisKeyPrefix}${syncJobId}:*`;
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Mark a row as processed
 */
export async function markRowProcessed(row: ProcessedRow): Promise<void> {
  const { syncJobId, tableName, rowId, operation, batchId } = row;
  const processedAt = row.processedAt || new Date();
  
  // Store in Redis (fast)
  const redis = getRedisClient();
  if (redis) {
    try {
      const key = getRedisKey(syncJobId, tableName, rowId);
      const value = JSON.stringify({
        operation,
        batchId,
        processedAt: processedAt.toISOString(),
      });
      
      await redis.setex(key, IDEMPOTENCY_CONFIG.redisExpireSeconds, value);
    } catch (error) {
      logger.warn('Failed to store in Redis', { error });
    }
  }
  
  // Store in database (backup, batched)
  if (IDEMPOTENCY_CONFIG.useDatabase) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase.from('sync_idempotency').upsert({
          sync_job_id: syncJobId,
          table_name: tableName,
          row_id: rowId,
          operation,
          batch_id: batchId,
          processed_at: processedAt.toISOString(),
        }, {
          onConflict: 'sync_job_id,table_name,row_id',
        });
      }
    } catch (error) {
      // Log but don't fail - Redis is primary
      logger.warn('Failed to store in database', { error });
    }
  }
}

/**
 * Mark multiple rows as processed (batch operation)
 */
export async function markRowsProcessed(rows: ProcessedRow[]): Promise<void> {
  if (rows.length === 0) return;
  
  const redis = getRedisClient();
  
  // Batch Redis operations
  if (redis) {
    try {
      const pipeline = redis.pipeline();
      
      for (const row of rows) {
        const key = getRedisKey(row.syncJobId, row.tableName, row.rowId);
        const value = JSON.stringify({
          operation: row.operation,
          batchId: row.batchId,
          processedAt: (row.processedAt || new Date()).toISOString(),
        });
        
        pipeline.setex(key, IDEMPOTENCY_CONFIG.redisExpireSeconds, value);
      }
      
      await pipeline.exec();
    } catch (error) {
      logger.warn('Failed to batch store in Redis', { error });
    }
  }
  
  // Batch database operations
  if (IDEMPOTENCY_CONFIG.useDatabase) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Process in batches
        for (let i = 0; i < rows.length; i += IDEMPOTENCY_CONFIG.batchSize) {
          const batch = rows.slice(i, i + IDEMPOTENCY_CONFIG.batchSize);
          
          const records = batch.map((row) => ({
            sync_job_id: row.syncJobId,
            table_name: row.tableName,
            row_id: row.rowId,
            operation: row.operation,
            batch_id: row.batchId,
            processed_at: (row.processedAt || new Date()).toISOString(),
          }));
          
          await supabase.from('sync_idempotency').upsert(records, {
            onConflict: 'sync_job_id,table_name,row_id',
          });
        }
      }
    } catch (error) {
      logger.warn('Failed to batch store in database', { error });
    }
  }
}

/**
 * Check if a row has been processed
 */
export async function isRowProcessed(
  syncJobId: string,
  tableName: string,
  rowId: string
): Promise<boolean> {
  // Check Redis first (fast)
  const redis = getRedisClient();
  if (redis) {
    try {
      const key = getRedisKey(syncJobId, tableName, rowId);
      const exists = await redis.exists(key);
      if (exists) {
        return true;
      }
    } catch (error) {
      logger.warn('Failed to check Redis', { error });
    }
  }
  
  // Check database (backup)
  if (IDEMPOTENCY_CONFIG.useDatabase) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data } = await supabase
          .from('sync_idempotency')
          .select('id')
          .eq('sync_job_id', syncJobId)
          .eq('table_name', tableName)
          .eq('row_id', rowId)
          .single();
        
        if (data) {
          return true;
        }
      }
    } catch (error) {
      // Not found is expected
    }
  }
  
  return false;
}

/**
 * Check if multiple rows have been processed
 */
export async function getProcessedRowIds(
  syncJobId: string,
  tableName: string,
  rowIds: string[]
): Promise<Set<string>> {
  const processedIds = new Set<string>();
  
  if (rowIds.length === 0) {
    return processedIds;
  }
  
  // Check Redis
  const redis = getRedisClient();
  if (redis) {
    try {
      const keys = rowIds.map((rowId) => getRedisKey(syncJobId, tableName, rowId));
      const results = await redis.mget(...keys);
      
      results.forEach((result, index) => {
        if (result) {
          processedIds.add(rowIds[index]);
        }
      });
    } catch (error) {
      logger.warn('Failed to batch check Redis', { error });
    }
  }
  
  // Check remaining in database
  const remainingIds = rowIds.filter((id) => !processedIds.has(id));
  
  if (remainingIds.length > 0 && IDEMPOTENCY_CONFIG.useDatabase) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data } = await supabase
          .from('sync_idempotency')
          .select('row_id')
          .eq('sync_job_id', syncJobId)
          .eq('table_name', tableName)
          .in('row_id', remainingIds);
        
        if (data) {
          data.forEach((row) => processedIds.add(row.row_id));
        }
      }
    } catch (error) {
      logger.warn('Failed to batch check database', { error });
    }
  }
  
  return processedIds;
}

/**
 * Get operation for a processed row
 */
export async function getRowOperation(
  syncJobId: string,
  tableName: string,
  rowId: string
): Promise<{ operation: string; batchId?: string; processedAt: Date } | null> {
  // Check Redis first
  const redis = getRedisClient();
  if (redis) {
    try {
      const key = getRedisKey(syncJobId, tableName, rowId);
      const value = await redis.get(key);
      
      if (value) {
        const data = JSON.parse(value);
        return {
          operation: data.operation,
          batchId: data.batchId,
          processedAt: new Date(data.processedAt),
        };
      }
    } catch (error) {
      logger.warn('Failed to get from Redis', { error });
    }
  }
  
  // Check database
  if (IDEMPOTENCY_CONFIG.useDatabase) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data } = await supabase
          .from('sync_idempotency')
          .select('operation, batch_id, processed_at')
          .eq('sync_job_id', syncJobId)
          .eq('table_name', tableName)
          .eq('row_id', rowId)
          .single();
        
        if (data) {
          return {
            operation: data.operation,
            batchId: data.batch_id,
            processedAt: new Date(data.processed_at),
          };
        }
      }
    } catch (error) {
      // Not found is expected
    }
  }
  
  return null;
}

/**
 * Get statistics for a sync job
 */
export async function getIdempotencyStats(syncJobId: string): Promise<IdempotencyStats> {
  const stats: IdempotencyStats = {
    totalProcessed: 0,
    inserts: 0,
    updates: 0,
    skips: 0,
  };
  
  // Get stats from database (more accurate for counts)
  if (IDEMPOTENCY_CONFIG.useDatabase) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data } = await supabase
          .from('sync_idempotency')
          .select('operation')
          .eq('sync_job_id', syncJobId);
        
        if (data) {
          stats.totalProcessed = data.length;
          stats.inserts = data.filter((r) => r.operation === 'insert').length;
          stats.updates = data.filter((r) => r.operation === 'update').length;
          stats.skips = data.filter((r) => r.operation === 'skip').length;
        }
      }
    } catch (error) {
      logger.warn('Failed to get stats from database', { error });
    }
  }
  
  return stats;
}

/**
 * Clear processed rows for a sync job
 */
export async function clearProcessedRows(syncJobId: string): Promise<void> {
  // Clear Redis
  const redis = getRedisClient();
  if (redis) {
    try {
      const pattern = getJobPattern(syncJobId);
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.warn('Failed to clear Redis', { error });
    }
  }
  
  // Clear database
  if (IDEMPOTENCY_CONFIG.useDatabase) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('sync_idempotency')
          .delete()
          .eq('sync_job_id', syncJobId);
      }
    } catch (error) {
      logger.warn('Failed to clear database', { error });
    }
  }
}

/**
 * Clear old idempotency records (cleanup)
 */
export async function cleanupOldRecords(maxAgeHours: number = 24): Promise<number> {
  let deletedCount = 0;
  
  // Database cleanup
  if (IDEMPOTENCY_CONFIG.useDatabase) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);
        
        const { data, error } = await supabase
          .from('sync_idempotency')
          .delete()
          .lt('processed_at', cutoffDate.toISOString())
          .select('id');
        
        deletedCount = error ? 0 : (data?.length || 0);
      }
    } catch (error) {
      logger.warn('Failed to cleanup database', { error });
    }
  }
  
  return deletedCount;
}

/**
 * Close Redis connection
 */
export async function closeIdempotencyTracker(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}


/**
 * Real-time sync execution without Redis/BullMQ
 * Runs the sync process directly in the Node.js process
 * 
 * Enhanced with:
 * - Retry logic with exponential backoff
 * - Job timeout protection
 * - Improved checkpoint granularity
 * - Network interruption handling
 */

import { createDrizzleClient, type DrizzleConnection } from './drizzle-factory';
import { getRowsToSync } from './diff-engine';
import { withRetry, withTimeout, sleep } from './retry-handler';
import type { SyncProgress, SyncCheckpoint, ConflictStrategy, Conflict } from '@/types';

// Configuration
const SYNC_CONFIG = {
  maxRetries: 3,
  retryDelay: 2000,
  jobTimeout: 2 * 60 * 60 * 1000, // 2 hours
  batchTimeout: 5 * 60 * 1000,    // 5 minutes per batch
  checkpointInterval: 100,         // Save checkpoint every 100 rows
};

// Track cancelled jobs
const cancelledJobs = new Set<string>();

// Track job start times for timeout
const jobStartTimes = new Map<string, number>();

export function markSyncCancelled(jobId: string): void {
  cancelledJobs.add(jobId);
}

function isSyncCancelled(jobId: string): boolean {
  return cancelledJobs.has(jobId);
}

function isJobTimedOut(jobId: string): boolean {
  const startTime = jobStartTimes.get(jobId);
  if (!startTime) return false;
  return Date.now() - startTime > SYNC_CONFIG.jobTimeout;
}

export interface RealtimeSyncOptions {
  jobId: string;
  sourceUrl: string;
  targetUrl: string;
  tables: { tableName: string; enabled: boolean; conflictStrategy?: string }[];
  direction: 'one_way' | 'two_way';
  checkpoint?: SyncCheckpoint;
  batchSize?: number;
  onProgress: (progress: SyncProgress) => void;
  onLog: (level: 'info' | 'warn' | 'error', message: string, metadata?: Record<string, unknown>) => void;
  onComplete: (success: boolean, checkpoint?: SyncCheckpoint) => void;
  onCheckpoint?: (checkpoint: SyncCheckpoint) => void;
}

/**
 * Execute sync in real-time (non-queued) with retry support
 */
export async function executeSyncRealtime(options: RealtimeSyncOptions): Promise<void> {
  const {
    jobId,
    sourceUrl,
    targetUrl,
    tables,
    direction,
    checkpoint,
    batchSize = 1000,
    onProgress,
    onLog,
    onComplete,
    onCheckpoint,
  } = options;
  
  // Record start time for timeout tracking
  jobStartTimes.set(jobId, Date.now());
  
  let sourceConn: DrizzleConnection | null = null;
  let targetConn: DrizzleConnection | null = null;
  
  const progress: SyncProgress = {
    totalTables: tables.filter((t) => t.enabled).length,
    completedTables: 0,
    currentTable: null,
    totalRows: 0,
    processedRows: 0,
    insertedRows: 0,
    updatedRows: 0,
    skippedRows: 0,
    errors: 0,
  };
  
  let currentCheckpoint: SyncCheckpoint | undefined;
  const processedTables: string[] = checkpoint?.processedTables || [];
  
  try {
    onLog('info', 'Connecting to databases...');
    
    // Connect with retry
    sourceConn = await withRetry(
      () => Promise.resolve(createDrizzleClient(sourceUrl)),
      {
        maxRetries: SYNC_CONFIG.maxRetries,
        initialDelay: SYNC_CONFIG.retryDelay,
        onRetry: (_, attempt) => {
          onLog('warn', `Source connection failed, retrying (attempt ${attempt})...`);
        },
      }
    );
    
    targetConn = await withRetry(
      () => Promise.resolve(createDrizzleClient(targetUrl)),
      {
        maxRetries: SYNC_CONFIG.maxRetries,
        initialDelay: SYNC_CONFIG.retryDelay,
        onRetry: (_, attempt) => {
          onLog('warn', `Target connection failed, retrying (attempt ${attempt})...`);
        },
      }
    );
    
    onLog('info', 'Connected successfully. Starting sync...');
    
    // Get enabled tables
    const enabledTables = tables.filter((t) => t.enabled);
    
    // Find starting point from checkpoint
    const startIndex = checkpoint?.lastTable
      ? enabledTables.findIndex((t) => t.tableName === checkpoint.lastTable)
      : 0;
    
    for (let i = Math.max(0, startIndex); i < enabledTables.length; i++) {
      const tableConfig = enabledTables[i];
      const tableName = tableConfig.tableName;
      
      // Skip already processed tables
      if (processedTables.includes(tableName) && !checkpoint?.lastRowId) {
        progress.completedTables++;
        onProgress(progress);
        continue;
      }
      
      // Check for cancellation
      if (isSyncCancelled(jobId)) {
        onLog('warn', 'Sync paused by user');
        currentCheckpoint = {
          lastTable: tableName,
          lastRowId: '',
          lastUpdatedAt: new Date().toISOString(),
          processedTables,
        };
        cancelledJobs.delete(jobId);
        jobStartTimes.delete(jobId);
        onComplete(false, currentCheckpoint);
        return;
      }
      
      // Check for timeout
      if (isJobTimedOut(jobId)) {
        onLog('error', 'Sync job timed out (2 hour limit)');
        currentCheckpoint = {
          lastTable: tableName,
          lastRowId: '',
          lastUpdatedAt: new Date().toISOString(),
          processedTables,
        };
        jobStartTimes.delete(jobId);
        onComplete(false, currentCheckpoint);
        return;
      }
      
      progress.currentTable = tableName;
      onProgress(progress);
      onLog('info', `Processing table: ${tableName} (${i + 1}/${enabledTables.length})`);
      
      try {
        // Sync this table with retry
        const result = await syncTableWithRetry({
          sourceConn,
          targetConn,
          tableName,
          conflictStrategy: (tableConfig.conflictStrategy as ConflictStrategy) || 'last_write_wins',
          direction,
          afterId: checkpoint?.lastTable === tableName ? checkpoint?.lastRowId : undefined,
          batchSize,
          jobId,
          onProgress: (tableProgress) => {
            progress.processedRows = tableProgress.processedRows;
            progress.insertedRows = tableProgress.inserted;
            progress.updatedRows = tableProgress.updated;
            progress.skippedRows = tableProgress.skipped;
            onProgress(progress);
          },
          onLog,
          onCheckpoint: (cp) => {
            currentCheckpoint = {
              ...cp,
              processedTables,
            };
            onCheckpoint?.(currentCheckpoint);
          },
        });
        
        if (result.cancelled) {
          currentCheckpoint = {
            lastTable: tableName,
            lastRowId: result.lastRowId || '',
            lastUpdatedAt: result.lastUpdatedAt || new Date().toISOString(),
            processedTables,
          };
          onComplete(false, currentCheckpoint);
          return;
        }
        
        processedTables.push(tableName);
        progress.completedTables++;
        onProgress(progress);
        
        onLog('info', `Completed table: ${tableName}`, {
          inserted: result.inserted,
          updated: result.updated,
          skipped: result.skipped,
        });
        
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        onLog('error', `Error syncing table ${tableName}: ${message}`);
        progress.errors++;
        onProgress(progress);
        
        // Save checkpoint for retry
        currentCheckpoint = {
          lastTable: tableName,
          lastRowId: '',
          lastUpdatedAt: new Date().toISOString(),
          processedTables,
        };
      }
    }
    
    onLog('info', 'Sync completed successfully', {
      tablesProcessed: progress.completedTables,
      rowsInserted: progress.insertedRows,
      rowsUpdated: progress.updatedRows,
    });
    
    jobStartTimes.delete(jobId);
    onComplete(progress.errors === 0);
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    onLog('error', `Sync failed: ${message}`);
    jobStartTimes.delete(jobId);
    onComplete(false, currentCheckpoint);
    throw error;
  } finally {
    if (sourceConn) await sourceConn.close();
    if (targetConn) await targetConn.close();
  }
}

interface TableSyncOptions {
  sourceConn: DrizzleConnection;
  targetConn: DrizzleConnection;
  tableName: string;
  conflictStrategy: ConflictStrategy;
  direction: 'one_way' | 'two_way';
  afterId?: string;
  batchSize: number;
  jobId: string;
  onProgress: (progress: { processedRows: number; inserted: number; updated: number; skipped: number }) => void;
  onLog: (level: 'info' | 'warn' | 'error', message: string, metadata?: Record<string, unknown>) => void;
  onCheckpoint?: (checkpoint: { lastTable: string; lastRowId: string; lastUpdatedAt: string }) => void;
}

interface TableSyncResult {
  inserted: number;
  updated: number;
  skipped: number;
  conflicts: Conflict[];
  cancelled: boolean;
  lastRowId?: string;
  lastUpdatedAt?: string;
}

/**
 * Sync a single table with retry logic
 */
async function syncTableWithRetry(options: TableSyncOptions): Promise<TableSyncResult> {
  return withRetry(
    () => syncTable(options),
    {
      maxRetries: SYNC_CONFIG.maxRetries,
      initialDelay: SYNC_CONFIG.retryDelay,
      retryCondition: (error) => {
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          // Retry on connection errors
          return message.includes('connection') || 
                 message.includes('timeout') || 
                 message.includes('network');
        }
        return false;
      },
      onRetry: (error, attempt) => {
        const message = error instanceof Error ? error.message : 'Unknown';
        options.onLog('warn', `Table sync failed, retrying (attempt ${attempt}): ${message}`);
      },
    }
  );
}

/**
 * Sync a single table
 */
async function syncTable(options: TableSyncOptions): Promise<TableSyncResult> {
  const {
    sourceConn,
    targetConn,
    tableName,
    conflictStrategy,
    direction,
    afterId,
    batchSize,
    jobId,
    onProgress,
    onLog,
    onCheckpoint,
  } = options;
  
  const result: TableSyncResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    conflicts: [],
    cancelled: false,
  };
  
  let currentAfterId = afterId;
  let hasMore = true;
  let processedRows = 0;
  let checkpointCounter = 0;
  
  while (hasMore) {
    // Check for cancellation
    if (isSyncCancelled(jobId)) {
      result.cancelled = true;
      result.lastRowId = currentAfterId;
      cancelledJobs.delete(jobId);
      return result;
    }
    
    // Check for timeout
    if (isJobTimedOut(jobId)) {
      result.cancelled = true;
      result.lastRowId = currentAfterId;
      return result;
    }
    
    // Get batch of rows to sync with timeout
    const batch = await withTimeout(
      async () => getRowsToSync(
        sourceConn,
        targetConn,
        tableName,
        undefined,
        currentAfterId,
        batchSize
      ),
      SYNC_CONFIG.batchTimeout,
      `Batch fetch timeout for table ${tableName}`
    );
    
    hasMore = batch.hasMore;
    currentAfterId = batch.lastId || currentAfterId;
    
    if (batch.rows.length === 0) {
      break;
    }
    
    // Process batch within a transaction
    await targetConn.client.begin(async (tx) => {
      for (const row of batch.rows) {
        try {
          // Check if row exists in target
          const existingResult = await tx.unsafe(
            `SELECT id, updated_at FROM "${tableName}" WHERE id = $1`,
            [row.id as string]
          );
          
          const existing = existingResult[0];
          
          if (!existing) {
            // Insert new row
            const columns = Object.keys(row);
            const values = Object.values(row) as (string | number | boolean | null)[];
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            const columnList = columns.map((c) => `"${c}"`).join(', ');
            
            await tx.unsafe(
              `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders})`,
              values
            );
            
            result.inserted++;
          } else {
            // Handle update with conflict resolution
            const sourceUpdatedAt = new Date(row.updated_at as string);
            const targetUpdatedAt = new Date(existing.updated_at as string);
            
            // Check for conflict in two-way sync
            if (direction === 'two_way' && targetUpdatedAt > sourceUpdatedAt) {
              if (conflictStrategy === 'manual') {
                result.conflicts.push({
                  id: `${tableName}-${row.id}`,
                  tableName,
                  rowId: row.id as string,
                  sourceData: row,
                  targetData: existing as Record<string, unknown>,
                  sourceUpdatedAt,
                  targetUpdatedAt,
                  resolution: 'pending',
                });
                result.skipped++;
                continue;
              }
              
              // Apply conflict strategy
              const shouldUpdate = resolveConflict(
                conflictStrategy,
                sourceUpdatedAt,
                targetUpdatedAt
              );
              
              if (!shouldUpdate) {
                result.skipped++;
                continue;
              }
            }
            
            // Update existing row if source is newer
            if (sourceUpdatedAt > targetUpdatedAt) {
              const columns = Object.keys(row).filter((c) => c !== 'id');
              const values = columns.map((c) => row[c]) as (string | number | boolean | null)[];
              const setClause = columns.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
              
              await tx.unsafe(
                `UPDATE "${tableName}" SET ${setClause} WHERE id = $${columns.length + 1}`,
                [...values, row.id as string]
              );
              
              result.updated++;
            } else {
              result.skipped++;
            }
          }
          
          processedRows++;
          checkpointCounter++;
          
          // Save checkpoint periodically
          if (checkpointCounter >= SYNC_CONFIG.checkpointInterval) {
            checkpointCounter = 0;
            onCheckpoint?.({
              lastTable: tableName,
              lastRowId: row.id as string,
              lastUpdatedAt: row.updated_at as string,
            });
          }
          
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          onLog('error', `Error processing row ${row.id}: ${message}`);
          result.skipped++;
        }
      }
    });
    
    // Update progress
    onProgress({
      processedRows,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
    });
    
    // Log batch progress
    if (processedRows > 0 && processedRows % (batchSize * 5) === 0) {
      onLog('info', `${tableName}: Processed ${processedRows} rows (${result.inserted} inserted, ${result.updated} updated)`);
    }
    
    // Store last processed row for checkpoint
    result.lastRowId = currentAfterId || undefined;
    if (batch.rows.length > 0) {
      const lastRow = batch.rows[batch.rows.length - 1];
      result.lastUpdatedAt = lastRow.updated_at as string;
    }
    
    // Small delay between batches to prevent overwhelming the database
    await sleep(100);
  }
  
  return result;
}

/**
 * Resolve conflict based on strategy
 */
function resolveConflict(
  strategy: ConflictStrategy,
  sourceUpdatedAt: Date,
  targetUpdatedAt: Date
): boolean {
  switch (strategy) {
    case 'last_write_wins':
      return sourceUpdatedAt > targetUpdatedAt;
    case 'source_wins':
      return true;
    case 'target_wins':
      return false;
    default:
      return false;
  }
}

/**
 * Get estimated time remaining
 */
export function estimateTimeRemaining(
  progress: SyncProgress,
  startTime: Date
): { seconds: number; formatted: string } | null {
  if (progress.processedRows === 0 || progress.totalRows === 0) {
    return null;
  }
  
  const elapsedMs = Date.now() - startTime.getTime();
  const rowsPerMs = progress.processedRows / elapsedMs;
  const remainingRows = progress.totalRows - progress.processedRows;
  const remainingMs = remainingRows / rowsPerMs;
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  
  // Format
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formatted = minutes > 0 
    ? `${minutes}m ${seconds}s`
    : `${seconds}s`;
  
  return { seconds: remainingSeconds, formatted };
}

/**
 * Calculate sync speed
 */
export function calculateSyncSpeed(
  processedRows: number,
  startTime: Date
): { rowsPerSecond: number; formatted: string } {
  const elapsedSeconds = (Date.now() - startTime.getTime()) / 1000;
  if (elapsedSeconds === 0) {
    return { rowsPerSecond: 0, formatted: '0 rows/sec' };
  }
  
  const rowsPerSecond = Math.round(processedRows / elapsedSeconds);
  return {
    rowsPerSecond,
    formatted: `${rowsPerSecond.toLocaleString()} rows/sec`,
  };
}

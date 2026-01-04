/**
 * Real-time sync execution without Redis/BullMQ
 * Runs the sync process directly in the Node.js process
 */

import { createDrizzleClient, type DrizzleConnection } from './drizzle-factory';
import { getRowsToSync } from './diff-engine';
import type { SyncProgress, SyncCheckpoint, ConflictStrategy, Conflict } from '@/types';

// Track cancelled jobs
const cancelledJobs = new Set<string>();

export function markSyncCancelled(jobId: string): void {
  cancelledJobs.add(jobId);
}

function isSyncCancelled(jobId: string): boolean {
  return cancelledJobs.has(jobId);
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
}

/**
 * Execute sync in real-time (non-queued)
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
  } = options;
  
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
    
    sourceConn = createDrizzleClient(sourceUrl);
    targetConn = createDrizzleClient(targetUrl);
    
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
        onComplete(false, currentCheckpoint);
        return;
      }
      
      progress.currentTable = tableName;
      onProgress(progress);
      onLog('info', `Processing table: ${tableName}`);
      
      try {
        // Sync this table
        const result = await syncTable({
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
      }
    }
    
    onLog('info', 'Sync completed successfully', {
      tablesProcessed: progress.completedTables,
      rowsInserted: progress.insertedRows,
      rowsUpdated: progress.updatedRows,
    });
    
    onComplete(progress.errors === 0);
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    onLog('error', `Sync failed: ${message}`);
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
  
  while (hasMore) {
    // Check for cancellation
    if (isSyncCancelled(jobId)) {
      result.cancelled = true;
      result.lastRowId = currentAfterId;
      cancelledJobs.delete(jobId);
      return result;
    }
    
    // Get batch of rows to sync
    const batch = await getRowsToSync(
      sourceConn,
      targetConn,
      tableName,
      undefined,
      currentAfterId,
      batchSize
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
    
    // Store last processed row for checkpoint
    result.lastRowId = currentAfterId || undefined;
    if (batch.rows.length > 0) {
      const lastRow = batch.rows[batch.rows.length - 1];
      result.lastUpdatedAt = lastRow.updated_at as string;
    }
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


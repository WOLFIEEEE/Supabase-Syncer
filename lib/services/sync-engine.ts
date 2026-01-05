import { createDrizzleClient, type DrizzleConnection } from './drizzle-factory';
import { getRowsToSync } from './diff-engine';
import { db } from '@/lib/db/client';
import { syncJobs, syncLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { SyncProgress, SyncCheckpoint, TableConfig, ConflictStrategy, Conflict } from '@/types';

// ============================================================================
// SAFE TYPE COERCION HELPERS
// ============================================================================

/**
 * Safely coerce a value to string
 */
function safeString(value: unknown, fallback: string = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

/**
 * Safely parse a date
 */
function safeDate(value: unknown, fallback: Date = new Date(0)): Date {
  if (value === null || value === undefined) return fallback;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? fallback : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? fallback : date;
  }
  return fallback;
}

export interface SyncOptions {
  jobId: string;
  sourceUrl: string;
  targetUrl: string;
  tables: TableConfig[];
  direction: 'one_way' | 'two_way';
  checkpoint?: SyncCheckpoint | null;
  batchSize?: number;
  onProgress?: (progress: SyncProgress) => Promise<void>;
  onLog?: (level: 'info' | 'warn' | 'error', message: string, metadata?: Record<string, unknown>) => Promise<void>;
  shouldCancel?: () => boolean;
}

export interface SyncResult {
  success: boolean;
  tablesProcessed: number;
  rowsInserted: number;
  rowsUpdated: number;
  rowsSkipped: number;
  errors: number;
  conflicts: Conflict[];
  checkpoint?: SyncCheckpoint;
}

/**
 * Execute database synchronization
 */
export async function executeSync(options: SyncOptions): Promise<SyncResult> {
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
    shouldCancel,
  } = options;
  
  let sourceConn: DrizzleConnection | null = null;
  let targetConn: DrizzleConnection | null = null;
  
  const result: SyncResult = {
    success: false,
    tablesProcessed: 0,
    rowsInserted: 0,
    rowsUpdated: 0,
    rowsSkipped: 0,
    errors: 0,
    conflicts: [],
  };
  
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
  
  try {
    await onLog?.('info', 'Starting sync job', { jobId, direction });
    
    sourceConn = createDrizzleClient(sourceUrl);
    targetConn = createDrizzleClient(targetUrl);
    
    await onLog?.('info', 'Connected to source and target databases');
    
    // Get tables to process
    const enabledTables = tables.filter((t) => t.enabled);
    const processedTables = checkpoint?.processedTables || [];
    
    // Resume from checkpoint if available
    const startIndex = checkpoint?.lastTable
      ? enabledTables.findIndex((t) => t.tableName === checkpoint.lastTable)
      : 0;
    
    for (let i = Math.max(0, startIndex); i < enabledTables.length; i++) {
      const tableConfig = enabledTables[i];
      const tableName = tableConfig.tableName;
      
      // Check if we should skip this table (already processed)
      if (processedTables.includes(tableName) && !checkpoint?.lastRowId) {
        progress.completedTables++;
        continue;
      }
      
      // Check for cancellation
      if (shouldCancel?.()) {
        await onLog?.('warn', 'Sync cancelled by user');
        result.checkpoint = {
          lastTable: tableName,
          lastRowId: '',
          lastUpdatedAt: new Date().toISOString(),
          processedTables,
        };
        return result;
      }
      
      progress.currentTable = tableName;
      await onProgress?.(progress);
      
      await onLog?.('info', `Processing table: ${tableName}`);
      
      try {
        // Get last synced timestamp for this table
        const since = checkpoint?.lastTable === tableName && checkpoint?.lastUpdatedAt
          ? new Date(checkpoint.lastUpdatedAt)
          : undefined;
        
        const afterId = checkpoint?.lastTable === tableName
          ? checkpoint?.lastRowId
          : undefined;
        
        // Sync table
        const tableResult = await syncTable({
          sourceConn,
          targetConn,
          tableName,
          conflictStrategy: tableConfig.conflictStrategy || 'last_write_wins',
          direction,
          since,
          afterId,
          batchSize,
          jobId,
          onProgress: async (tableProgress) => {
            progress.processedRows = tableProgress.processedRows;
            progress.insertedRows += tableProgress.inserted;
            progress.updatedRows += tableProgress.updated;
            progress.skippedRows += tableProgress.skipped;
            await onProgress?.(progress);
          },
          onLog,
          shouldCancel,
        });
        
        result.rowsInserted += tableResult.inserted;
        result.rowsUpdated += tableResult.updated;
        result.rowsSkipped += tableResult.skipped;
        result.conflicts.push(...tableResult.conflicts);
        
        if (tableResult.cancelled) {
          result.checkpoint = {
            lastTable: tableName,
            lastRowId: tableResult.lastRowId || '',
            lastUpdatedAt: tableResult.lastUpdatedAt || new Date().toISOString(),
            processedTables,
          };
          return result;
        }
        
        processedTables.push(tableName);
        progress.completedTables++;
        
        await onLog?.('info', `Completed table: ${tableName}`, {
          inserted: tableResult.inserted,
          updated: tableResult.updated,
          skipped: tableResult.skipped,
        });
        
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        await onLog?.('error', `Error syncing table ${tableName}: ${message}`);
        result.errors++;
        progress.errors++;
        
        // Save checkpoint for resuming
        result.checkpoint = {
          lastTable: tableName,
          lastRowId: '',
          lastUpdatedAt: new Date().toISOString(),
          processedTables,
        };
      }
    }
    
    result.success = result.errors === 0;
    result.tablesProcessed = progress.completedTables;
    
    await onLog?.('info', 'Sync completed', {
      success: result.success,
      tablesProcessed: result.tablesProcessed,
      rowsInserted: result.rowsInserted,
      rowsUpdated: result.rowsUpdated,
    });
    
    return result;
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await onLog?.('error', `Sync failed: ${message}`);
    result.errors++;
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
  since?: Date;
  afterId?: string;
  batchSize: number;
  jobId: string;
  onProgress?: (progress: { processedRows: number; inserted: number; updated: number; skipped: number }) => Promise<void>;
  onLog?: (level: 'info' | 'warn' | 'error', message: string, metadata?: Record<string, unknown>) => Promise<void>;
  shouldCancel?: () => boolean;
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
    since,
    afterId,
    batchSize,
    onProgress,
    onLog,
    shouldCancel,
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
    if (shouldCancel?.()) {
      result.cancelled = true;
      result.lastRowId = currentAfterId;
      return result;
    }
    
    // Get batch of rows to sync
    const batch = await getRowsToSync(
      sourceConn,
      targetConn,
      tableName,
      since,
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
        const rowId = safeString(row.id);
        if (!rowId) {
          result.skipped++;
          continue;
        }
        
        try {
          // Check if row exists in target
          const existingResult = await tx.unsafe(
            `SELECT id, updated_at FROM "${tableName}" WHERE id = $1`,
            [rowId]
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
            const sourceUpdatedAt = safeDate(row.updated_at);
            const targetUpdatedAt = safeDate(existing.updated_at);
            
            // Check for conflict in two-way sync
            if (direction === 'two_way' && targetUpdatedAt > sourceUpdatedAt) {
              // Conflict detected
              if (conflictStrategy === 'manual') {
                result.conflicts.push({
                  id: `${tableName}-${rowId}`,
                  tableName,
                  rowId,
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
            
            // Update existing row
            if (sourceUpdatedAt > targetUpdatedAt) {
              const columns = Object.keys(row).filter((c) => c !== 'id');
              const values = columns.map((c) => row[c]) as (string | number | boolean | null)[];
              const setClause = columns.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
              
              await tx.unsafe(
                `UPDATE "${tableName}" SET ${setClause} WHERE id = $${columns.length + 1}`,
                [...values, rowId]
              );
              
              result.updated++;
            } else {
              result.skipped++;
            }
          }
          
          processedRows++;
          
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          await onLog?.('error', `Error processing row ${rowId}: ${message}`);
          result.skipped++;
        }
      }
    });
    
    // Update progress
    await onProgress?.({
      processedRows,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
    });
    
    // Store last processed row for checkpoint
    result.lastRowId = currentAfterId || undefined;
    if (batch.rows.length > 0) {
      const lastRow = batch.rows[batch.rows.length - 1];
      result.lastUpdatedAt = safeString(lastRow.updated_at, new Date().toISOString());
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

/**
 * Update sync job status in database
 */
export async function updateSyncJobStatus(
  jobId: string,
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused',
  progress?: SyncProgress,
  checkpoint?: SyncCheckpoint
): Promise<void> {
  const updates: Partial<typeof syncJobs.$inferInsert> = {
    status,
    ...(progress && { progress }),
    ...(checkpoint && { checkpoint }),
  };
  
  if (status === 'running') {
    updates.startedAt = new Date();
  } else if (status === 'completed' || status === 'failed') {
    updates.completedAt = new Date();
  }
  
  await db.update(syncJobs).set(updates).where(eq(syncJobs.id, jobId));
}

/**
 * Add sync log entry
 */
export async function addSyncLog(
  syncJobId: string,
  level: 'info' | 'warn' | 'error',
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await db.insert(syncLogs).values({
    syncJobId,
    level,
    message,
    metadata: metadata || null,
  });
}


/**
 * Parallel Sync Engine
 * 
 * Executes table syncs in parallel while respecting foreign key dependencies.
 * Uses a worker pool pattern with configurable concurrency.
 */

import { createDrizzleClient, type DrizzleConnection } from './drizzle-factory';
import type { SyncProgress, SyncCheckpoint, TableConfig, Conflict } from '@/types';
import {
  validateTableNames,
  buildSafeTableLiteralArray,
  SecurityError,
} from './security-utils';

// ============================================================================
// TYPES
// ============================================================================

export interface ParallelSyncConfig {
  maxConcurrency: number;
  respectForeignKeys: boolean;
  batchSize: number;
  isolationLevel: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  onTableStart?: (tableName: string) => void;
  onTableComplete?: (tableName: string, result: TableSyncResult) => void;
  onTableError?: (tableName: string, error: Error) => void;
  onProgress?: (progress: ParallelProgress) => void;
  onLog?: (level: 'info' | 'warn' | 'error', message: string, metadata?: Record<string, unknown>) => void;
  shouldCancel?: () => boolean;
}

export interface ParallelSyncOptions {
  jobId: string;
  sourceUrl: string;
  targetUrl: string;
  tables: TableConfig[];
  direction: 'one_way' | 'two_way';
  checkpoint?: SyncCheckpoint | null;
  config: Partial<ParallelSyncConfig>;
}

export interface TableSyncResult {
  tableName: string;
  success: boolean;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  conflicts: Conflict[];
  durationMs: number;
  error?: string;
}

export interface ParallelProgress {
  totalTables: number;
  completedTables: number;
  runningTables: string[];
  pendingTables: string[];
  totalRows: number;
  processedRows: number;
  insertedRows: number;
  updatedRows: number;
  skippedRows: number;
  errors: number;
}

export interface ParallelSyncResult {
  success: boolean;
  tablesProcessed: number;
  tableResults: Map<string, TableSyncResult>;
  rowsInserted: number;
  rowsUpdated: number;
  rowsSkipped: number;
  errors: number;
  conflicts: Conflict[];
  durationMs: number;
  checkpoint?: SyncCheckpoint;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/**
 * Default configuration for parallel sync.
 *
 * IMPORTANT: maxConcurrency should not exceed the database connection pool size.
 * Each worker uses the shared connection, but concurrent transactions can
 * exhaust pool connections. The default pool size in drizzle-factory is 10,
 * so maxConcurrency should stay well below that to leave room for other operations.
 */
const DEFAULT_CONFIG: ParallelSyncConfig = {
  maxConcurrency: 3, // Reduced from 4 to prevent pool exhaustion (pool size is 10)
  respectForeignKeys: true,
  batchSize: 1000,
  isolationLevel: 'REPEATABLE READ',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safely convert unknown value to string
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
 * Get foreign key dependency graph for tables
 */
async function getForeignKeyGraph(
  conn: DrizzleConnection,
  tableNames: string[]
): Promise<Map<string, Set<string>>> {
  const graph = new Map<string, Set<string>>();
  
  // Initialize all tables
  for (const table of tableNames) {
    graph.set(table, new Set());
  }
  
  if (tableNames.length === 0) return graph;
  
  // SECURITY: Validate all table names before use
  const { valid: validTableNames, invalid: invalidTableNames } = validateTableNames(tableNames);
  
  if (invalidTableNames.length > 0) {
    throw new SecurityError(`Invalid table names detected: ${invalidTableNames.slice(0, 3).join(', ')}`);
  }
  
  // SECURITY: Build safe table list using validated and escaped literals
  const tableListSql = buildSafeTableLiteralArray(validTableNames);
  
  const fkResult = await conn.client.unsafe(`
    SELECT DISTINCT
      tc.table_name AS child_table,
      ccu.table_name AS parent_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
      AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name IN (${tableListSql})
      AND ccu.table_name IN (${tableListSql})
  `);
  
  // Build dependency graph (child depends on parent)
  for (const row of fkResult) {
    const child = safeString(row.child_table);
    const parent = safeString(row.parent_table);
    
    if (child && parent && child !== parent) {
      const deps = graph.get(child) || new Set();
      deps.add(parent);
      graph.set(child, deps);
    }
  }
  
  return graph;
}

/**
 * Get tables that are ready to process (all dependencies completed)
 */
function getReadyTables(
  allTables: string[],
  completedTables: Set<string>,
  runningTables: Set<string>,
  fkGraph: Map<string, Set<string>>
): string[] {
  const ready: string[] = [];
  
  for (const table of allTables) {
    // Skip if already completed or running
    if (completedTables.has(table) || runningTables.has(table)) {
      continue;
    }
    
    // Check if all dependencies are completed
    const deps = fkGraph.get(table) || new Set();
    const allDepsCompleted = [...deps].every((dep) => completedTables.has(dep));
    
    if (allDepsCompleted) {
      ready.push(table);
    }
  }
  
  return ready;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// TABLE SYNC WORKER
// ============================================================================

/**
 * Sync a single table
 */
async function syncTableWorker(
  sourceConn: DrizzleConnection,
  targetConn: DrizzleConnection,
  tableName: string,
  config: ParallelSyncConfig,
  direction: 'one_way' | 'two_way',
  tableConfig: TableConfig
): Promise<TableSyncResult> {
  const startTime = Date.now();
  const result: TableSyncResult = {
    tableName,
    success: false,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    conflicts: [],
    durationMs: 0,
  };
  
  try {
    config.onLog?.('info', `Starting sync for table: ${tableName}`);
    
    // Get column info
    const columnsResult = await sourceConn.client`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
      ORDER BY ordinal_position
    `;
    
    const columns = columnsResult.map((r) => safeString(r.column_name));
    
    if (columns.length === 0) {
      config.onLog?.('warn', `Table ${tableName} has no columns, skipping`);
      result.success = true;
      result.durationMs = Date.now() - startTime;
      return result;
    }
    
    // Find primary key column
    const pkResult = await sourceConn.client`
      SELECT a.attname as column_name
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = ${tableName}::regclass
        AND i.indisprimary
    `;
    
    const pkColumn = pkResult.length > 0 ? safeString(pkResult[0].column_name) : 'id';
    
    // Fetch rows in batches
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      // Check for cancellation
      if (config.shouldCancel?.()) {
        config.onLog?.('warn', `Sync cancelled for table: ${tableName}`);
        result.durationMs = Date.now() - startTime;
        return result;
      }
      
      // Fetch batch from source
      // SECURITY: Use parameterized query for LIMIT/OFFSET to prevent SQL injection
      const safeBatchSize = Math.min(Math.max(1, config.batchSize), 10000);
      const safeOffset = Math.max(0, offset);
      const rows = await sourceConn.client.unsafe(
        `SELECT * FROM "${tableName}" ORDER BY "${pkColumn}" LIMIT $1 OFFSET $2`,
        [safeBatchSize, safeOffset]
      );
      
      if (rows.length === 0) {
        hasMore = false;
        break;
      }
      
      // Process batch in transaction with isolation level and timeout
      await targetConn.client.begin(async (tx) => {
        // Set statement timeout to prevent deadlocks (30 seconds per batch)
        await tx.unsafe('SET LOCAL statement_timeout = 30000');
        await tx.unsafe(`SET TRANSACTION ISOLATION LEVEL ${config.isolationLevel}`);
        
        for (const row of rows) {
          const rowId = safeString(row[pkColumn]);
          if (!rowId) {
            result.skipped++;
            continue;
          }
          
          try {
            // Build UPSERT query
            const columnList = columns.map((c) => `"${c}"`).join(', ');
            const values = columns.map((c) => row[c]);
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            const updateSet = columns
              .filter((c) => c !== pkColumn)
              .map((c) => `"${c}" = EXCLUDED."${c}"`)
              .join(', ');
            
            const upsertSQL = `
              INSERT INTO "${tableName}" (${columnList})
              VALUES (${placeholders})
              ON CONFLICT ("${pkColumn}") DO UPDATE SET ${updateSet}
              WHERE "${tableName}".updated_at IS NULL 
                 OR "${tableName}".updated_at < EXCLUDED.updated_at
            `;
            
            const upsertResult = await tx.unsafe(upsertSQL, values);
            
            // Check if insert or update
            if (upsertResult.count === 1) {
              // Determine if it was insert or update by checking if row existed
              const existedResult = await tx.unsafe(
                `SELECT 1 FROM "${tableName}" WHERE "${pkColumn}" = $1`,
                [rowId]
              );
              
              if (existedResult.length > 0) {
                result.updated++;
              } else {
                result.inserted++;
              }
            } else {
              result.skipped++;
            }
          } catch (rowError) {
            const message = rowError instanceof Error ? rowError.message : 'Unknown error';
            config.onLog?.('error', `Error syncing row ${rowId} in ${tableName}: ${message}`);
            result.errors++;
          }
        }
      });
      
      offset += config.batchSize;
      
      // Check if last batch
      if (rows.length < config.batchSize) {
        hasMore = false;
      }
    }
    
    result.success = result.errors === 0;
    result.durationMs = Date.now() - startTime;
    
    config.onLog?.('info', `Completed sync for ${tableName}: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped`);
    
    return result;
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    result.error = message;
    result.durationMs = Date.now() - startTime;
    
    config.onLog?.('error', `Failed to sync table ${tableName}: ${message}`);
    
    return result;
  }
}

// ============================================================================
// PARALLEL SYNC ENGINE CLASS
// ============================================================================

export class ParallelSyncEngine {
  private config: ParallelSyncConfig;
  private fkGraph: Map<string, Set<string>> = new Map();
  private completedTables: Set<string> = new Set();
  private runningTables: Set<string> = new Set();
  private tableResults: Map<string, TableSyncResult> = new Map();
  private cancelled: boolean = false;
  
  constructor(config: Partial<ParallelSyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Execute parallel sync
   */
  async execute(options: ParallelSyncOptions): Promise<ParallelSyncResult> {
    const startTime = Date.now();
    const { jobId, sourceUrl, targetUrl, tables, direction, checkpoint } = options;
    
    // Merge config
    this.config = { ...this.config, ...options.config };
    
    // Reset state
    this.completedTables = new Set(checkpoint?.processedTables || []);
    this.runningTables = new Set();
    this.tableResults = new Map();
    this.cancelled = false;
    
    let sourceConn: DrizzleConnection | null = null;
    let targetConn: DrizzleConnection | null = null;
    
    try {
      this.config.onLog?.('info', `Starting parallel sync with ${this.config.maxConcurrency} workers`);
      
      // Connect to databases
      sourceConn = createDrizzleClient(sourceUrl);
      targetConn = createDrizzleClient(targetUrl);
      
      // Get enabled tables
      const enabledTables = tables
        .filter((t) => t.enabled)
        .map((t) => t.tableName);
      
      // Build FK dependency graph
      if (this.config.respectForeignKeys) {
        this.fkGraph = await getForeignKeyGraph(sourceConn, enabledTables);
        this.config.onLog?.('info', 'Built foreign key dependency graph');
      }
      
      // Create table config map
      const tableConfigMap = new Map(tables.map((t) => [t.tableName, t]));
      
      // Process tables in parallel
      const pendingTables = enabledTables.filter((t) => !this.completedTables.has(t));
      
      while (pendingTables.length > this.completedTables.size + this.runningTables.size || this.runningTables.size > 0) {
        // Check for cancellation
        if (this.config.shouldCancel?.() || this.cancelled) {
          this.config.onLog?.('warn', 'Parallel sync cancelled');
          break;
        }
        
        // Get tables ready to process
        const readyTables = getReadyTables(
          enabledTables,
          this.completedTables,
          this.runningTables,
          this.fkGraph
        );
        
        // Start workers for ready tables up to max concurrency
        const availableSlots = this.config.maxConcurrency - this.runningTables.size;
        const tablesToStart = readyTables.slice(0, availableSlots);
        
        // Start sync workers
        const workerPromises: Promise<void>[] = [];
        
        for (const tableName of tablesToStart) {
          this.runningTables.add(tableName);
          this.config.onTableStart?.(tableName);
          
          // Report progress
          this.reportProgress(enabledTables);
          
          // Create worker promise
          const workerPromise = (async () => {
            const tableConfig = tableConfigMap.get(tableName) || {
              tableName,
              enabled: true,
            };
            
            const result = await syncTableWorker(
              sourceConn!,
              targetConn!,
              tableName,
              this.config,
              direction,
              tableConfig
            );
            
            // Update state
            this.runningTables.delete(tableName);
            this.completedTables.add(tableName);
            this.tableResults.set(tableName, result);
            
            this.config.onTableComplete?.(tableName, result);
            
            if (!result.success) {
              this.config.onTableError?.(tableName, new Error(result.error || 'Unknown error'));
            }
            
            // Report progress
            this.reportProgress(enabledTables);
          })();
          
          workerPromises.push(workerPromise);
        }
        
        // Wait for at least one worker to complete if we're at max concurrency
        if (this.runningTables.size >= this.config.maxConcurrency) {
          await Promise.race(workerPromises);
        } else if (workerPromises.length === 0 && this.runningTables.size === 0) {
          // No tables ready and nothing running - might be stuck due to circular deps
          this.config.onLog?.('warn', 'No tables ready to process - possible circular dependency');
          break;
        } else {
          // Wait a bit before checking again
          await sleep(100);
        }
      }
      
      // Wait for all remaining workers
      while (this.runningTables.size > 0) {
        await sleep(100);
      }
      
      // Aggregate results
      const result = this.aggregateResults(startTime, enabledTables);
      
      this.config.onLog?.('info', `Parallel sync completed: ${result.tablesProcessed} tables, ${result.rowsInserted} inserted, ${result.rowsUpdated} updated`);
      
      return result;
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.config.onLog?.('error', `Parallel sync failed: ${message}`);
      
      return {
        success: false,
        tablesProcessed: this.completedTables.size,
        tableResults: this.tableResults,
        rowsInserted: 0,
        rowsUpdated: 0,
        rowsSkipped: 0,
        errors: 1,
        conflicts: [],
        durationMs: Date.now() - startTime,
      };
      
    } finally {
      // Cleanup connections
      if (sourceConn) await sourceConn.close();
      if (targetConn) await targetConn.close();
    }
  }
  
  /**
   * Cancel the sync
   */
  cancel(): void {
    this.cancelled = true;
  }
  
  /**
   * Report current progress
   */
  private reportProgress(allTables: string[]): void {
    const progress: ParallelProgress = {
      totalTables: allTables.length,
      completedTables: this.completedTables.size,
      runningTables: [...this.runningTables],
      pendingTables: allTables.filter(
        (t) => !this.completedTables.has(t) && !this.runningTables.has(t)
      ),
      totalRows: 0,
      processedRows: 0,
      insertedRows: 0,
      updatedRows: 0,
      skippedRows: 0,
      errors: 0,
    };
    
    // Aggregate from completed tables
    for (const result of this.tableResults.values()) {
      progress.insertedRows += result.inserted;
      progress.updatedRows += result.updated;
      progress.skippedRows += result.skipped;
      progress.errors += result.errors;
      progress.processedRows += result.inserted + result.updated + result.skipped;
    }
    
    this.config.onProgress?.(progress);
  }
  
  /**
   * Aggregate final results
   */
  private aggregateResults(startTime: number, allTables: string[]): ParallelSyncResult {
    let rowsInserted = 0;
    let rowsUpdated = 0;
    let rowsSkipped = 0;
    let errors = 0;
    const conflicts: Conflict[] = [];
    
    for (const result of this.tableResults.values()) {
      rowsInserted += result.inserted;
      rowsUpdated += result.updated;
      rowsSkipped += result.skipped;
      errors += result.errors;
      conflicts.push(...result.conflicts);
    }
    
    const success = errors === 0 && this.completedTables.size === allTables.length;
    
    // Build checkpoint if not all tables completed
    let checkpoint: SyncCheckpoint | undefined;
    if (!success) {
      checkpoint = {
        lastTable: [...this.completedTables].pop() || '',
        lastRowId: '',
        lastUpdatedAt: new Date().toISOString(),
        processedTables: [...this.completedTables],
      };
    }
    
    return {
      success,
      tablesProcessed: this.completedTables.size,
      tableResults: this.tableResults,
      rowsInserted,
      rowsUpdated,
      rowsSkipped,
      errors,
      conflicts,
      durationMs: Date.now() - startTime,
      checkpoint,
    };
  }
}

/**
 * Execute parallel sync (convenience function)
 */
export async function executeParallelSync(
  options: ParallelSyncOptions
): Promise<ParallelSyncResult> {
  const engine = new ParallelSyncEngine(options.config);
  return engine.execute(options);
}


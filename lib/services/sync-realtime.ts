/**
 * Real-time sync execution without Redis/BullMQ
 * Runs the sync process directly in the Node.js process
 * 
 * Enhanced with:
 * - Retry logic with exponential backoff
 * - Job timeout protection
 * - Improved checkpoint granularity
 * - Network interruption handling
 * - Foreign key dependency ordering (topological sort)
 * - Bulk inserts for better performance
 * - Generated column filtering
 */

import { createDrizzleClient, type DrizzleConnection } from './drizzle-factory';
import { getRowsToSync } from './diff-engine';
import { withRetry, withTimeout, sleep } from './retry-handler';
import type { SyncProgress, SyncCheckpoint, ConflictStrategy, Conflict } from '@/types';

// Configuration - smaller batches for better progress visibility
const SYNC_CONFIG = {
  maxRetries: 3,
  retryDelay: 2000,
  jobTimeout: 2 * 60 * 60 * 1000, // 2 hours
  batchTimeout: 2 * 60 * 1000,    // 2 minutes per batch
  checkpointInterval: 50,          // Save checkpoint every 50 rows
  defaultBatchSize: 100,           // Small batches for visible progress
  bulkInsertSize: 50,              // Rows per bulk INSERT statement
};

// Cache for table metadata (generated columns, FK order)
const tableMetadataCache = new Map<string, {
  generatedColumns: Set<string>;
  fkOrder: string[];
  fetchedAt: number;
}>();

/**
 * Get foreign key dependency order for tables using topological sort
 * This ensures parent tables are synced before child tables
 */
async function getTableSyncOrder(
  conn: DrizzleConnection,
  tableNames: string[]
): Promise<string[]> {
  if (tableNames.length === 0) return [];
  
  // Build placeholders for IN clause (postgres.js doesn't handle arrays well with unsafe())
  const placeholders = tableNames.map((_, i) => `$${i + 1}`).join(', ');
  
  // Get all FK relationships for these tables
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
      AND tc.table_name IN (${placeholders})
      AND ccu.table_name IN (${placeholders})
  `, [...tableNames, ...tableNames]);

  // Build dependency graph
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize
  for (const table of tableNames) {
    graph.set(table, []);
    inDegree.set(table, 0);
  }

  // Build edges (parent -> child means parent must be synced first)
  for (const row of fkResult) {
    const parent = row.parent_table as string;
    const child = row.child_table as string;
    
    // Skip self-references
    if (parent === child) continue;
    
    const deps = graph.get(parent) || [];
    if (!deps.includes(child)) {
      deps.push(child);
      graph.set(parent, deps);
      inDegree.set(child, (inDegree.get(child) || 0) + 1);
    }
  }

  // Topological sort (Kahn's algorithm)
  const order: string[] = [];
  const queue = tableNames.filter(t => inDegree.get(t) === 0);

  while (queue.length > 0) {
    const node = queue.shift()!;
    order.push(node);

    for (const neighbor of graph.get(node) || []) {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Add any remaining tables (circular dependencies - sync them last with warning)
  for (const table of tableNames) {
    if (!order.includes(table)) {
      order.push(table);
    }
  }

  return order;
}

/**
 * Get generated/computed columns that should be excluded from INSERT
 */
async function getGeneratedColumns(
  conn: DrizzleConnection,
  tableName: string
): Promise<Set<string>> {
  const result = await conn.client.unsafe(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND (
        is_generated = 'ALWAYS'
        OR generation_expression IS NOT NULL
        OR identity_generation IS NOT NULL
      )
  `, [tableName]);

  return new Set(result.map(r => r.column_name as string));
}

/**
 * Check if table has triggers that might interfere with sync
 */
async function getTableTriggers(
  conn: DrizzleConnection,
  tableName: string
): Promise<string[]> {
  const result = await conn.client.unsafe(`
    SELECT trigger_name
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND event_object_table = $1
      AND trigger_name NOT LIKE 'RI_%'
  `, [tableName]);

  return result.map(r => r.trigger_name as string);
}

/**
 * Get all unique constraints for a table (for ON CONFLICT handling)
 */
async function getUniqueConstraints(
  conn: DrizzleConnection,
  tableName: string
): Promise<{ name: string; columns: string[] }[]> {
  const result = await conn.client.unsafe(`
    SELECT 
      tc.constraint_name,
      array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = $1
      AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
    GROUP BY tc.constraint_name
  `, [tableName]);

  return result.map(r => ({
    name: r.constraint_name as string,
    columns: Array.isArray(r.columns) ? r.columns as string[] : 
      (r.columns as string).replace(/[{}]/g, '').split(',').filter(Boolean),
  }));
}

/**
 * Get NOT NULL columns that don't have defaults (potential sync issues)
 */
async function getNotNullColumnsWithoutDefaults(
  conn: DrizzleConnection,
  tableName: string
): Promise<Set<string>> {
  const result = await conn.client.unsafe(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND is_nullable = 'NO'
      AND column_default IS NULL
      AND is_generated = 'NEVER'
      AND identity_generation IS NULL
  `, [tableName]);

  return new Set(result.map(r => r.column_name as string));
}

/**
 * Get CHECK constraints for a table (to validate data before insert)
 */
async function getCheckConstraints(
  conn: DrizzleConnection,
  tableName: string
): Promise<{ name: string; definition: string }[]> {
  const result = await conn.client.unsafe(`
    SELECT 
      cc.constraint_name,
      cc.check_clause
    FROM information_schema.check_constraints cc
    JOIN information_schema.table_constraints tc 
      ON cc.constraint_name = tc.constraint_name
      AND cc.constraint_schema = tc.constraint_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = $1
      AND tc.constraint_type = 'CHECK'
      AND cc.constraint_name NOT LIKE '%_not_null'
  `, [tableName]);

  return result.map(r => ({
    name: r.constraint_name as string,
    definition: r.check_clause as string,
  }));
}

/**
 * Detect circular foreign key dependencies
 */
async function detectCircularDependencies(
  conn: DrizzleConnection,
  tableNames: string[]
): Promise<string[][]> {
  if (tableNames.length === 0) return [];
  
  // Build placeholders for IN clause
  const placeholders = tableNames.map((_, i) => `$${i + 1}`).join(', ');
  
  const fkResult = await conn.client.unsafe(`
    SELECT DISTINCT
      tc.table_name AS child_table,
      ccu.table_name AS parent_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name IN (${placeholders})
      AND ccu.table_name IN (${placeholders})
  `, [...tableNames, ...tableNames]);

  // Build adjacency list
  const graph = new Map<string, Set<string>>();
  for (const table of tableNames) {
    graph.set(table, new Set());
  }
  for (const row of fkResult) {
    const child = row.child_table as string;
    const parent = row.parent_table as string;
    if (child !== parent) {
      graph.get(child)?.add(parent);
    }
  }

  // Find cycles using DFS
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): boolean {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    for (const neighbor of graph.get(node) || []) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        // Found cycle
        const cycleStart = path.indexOf(neighbor);
        cycles.push(path.slice(cycleStart));
        return true;
      }
    }

    path.pop();
    recursionStack.delete(node);
    return false;
  }

  for (const table of tableNames) {
    if (!visited.has(table)) {
      dfs(table);
    }
  }

  return cycles;
}

/**
 * Defer foreign key constraints for a session (allows out-of-order inserts)
 */
async function deferForeignKeyConstraints(
  conn: DrizzleConnection,
  tableName: string
): Promise<string[]> {
  // Get deferrable FK constraints
  const result = await conn.client.unsafe(`
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = $1
      AND constraint_type = 'FOREIGN KEY'
  `, [tableName]);

  const constraintNames = result.map(r => r.constraint_name as string);
  
  // Note: This only works if constraints are defined as DEFERRABLE
  // Most FK constraints are NOT deferrable by default
  for (const name of constraintNames) {
    try {
      await conn.client.unsafe(`SET CONSTRAINTS "${name}" DEFERRED`);
    } catch {
      // Constraint not deferrable - this is expected for most FKs
    }
  }

  return constraintNames;
}

/**
 * Estimate row size in bytes (for large row detection)
 */
function estimateRowSize(row: Record<string, unknown>): number {
  let size = 0;
  for (const value of Object.values(row)) {
    if (value === null || value === undefined) {
      size += 4;
    } else if (typeof value === 'string') {
      size += value.length * 2; // UTF-16
    } else if (typeof value === 'number') {
      size += 8;
    } else if (typeof value === 'boolean') {
      size += 1;
    } else if (typeof value === 'object') {
      size += JSON.stringify(value).length * 2;
    }
  }
  return size;
}

// Maximum row size (1MB) - rows larger than this will be handled specially
const MAX_ROW_SIZE = 1024 * 1024;

/**
 * Table metadata for smarter sync
 */
interface TableSyncMetadata {
  generatedColumns: Set<string>;
  uniqueConstraints: { name: string; columns: string[] }[];
  notNullColumns: Set<string>;
  checkConstraints: { name: string; definition: string }[];
  triggers: string[];
  hasCircularDeps: boolean;
}

/**
 * Validate a row against known constraints
 * Returns validation result with any issues found
 */
function validateRow(
  row: Record<string, unknown>,
  notNullColumns: Set<string>,
  generatedColumns: Set<string>
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check NOT NULL columns
  for (const col of notNullColumns) {
    if (generatedColumns.has(col)) continue; // Skip generated columns
    if (col === 'id') continue; // ID is always provided
    
    const value = row[col];
    if (value === null || value === undefined) {
      issues.push(`NULL value in NOT NULL column: ${col}`);
    }
  }

  // Check row size
  const rowSize = estimateRowSize(row);
  if (rowSize > MAX_ROW_SIZE) {
    issues.push(`Row too large: ${Math.round(rowSize / 1024)}KB (max 1MB)`);
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Bulk insert rows using multi-value INSERT for better performance
 * Returns the number of successfully inserted rows
 * 
 * Handles:
 * - Generated columns (excluded)
 * - Unique constraint violations (ON CONFLICT DO UPDATE)
 * - NOT NULL violations (skip with warning)
 * - Large rows (process individually)
 */
async function bulkInsertRows(
  tx: ReturnType<DrizzleConnection['client']['begin']> extends Promise<infer T> ? T : never,
  tableName: string,
  rows: Record<string, unknown>[],
  generatedColumns: Set<string>,
  onLog: (level: 'info' | 'warn' | 'error', message: string) => void,
  metadata?: TableSyncMetadata
): Promise<number> {
  if (rows.length === 0) return 0;
  
  let inserted = 0;
  let skippedValidation = 0;
  const bulkSize = SYNC_CONFIG.bulkInsertSize;
  const notNullColumns = metadata?.notNullColumns || new Set<string>();
  
  // Separate large rows for individual processing
  const normalRows: Record<string, unknown>[] = [];
  const largeRows: Record<string, unknown>[] = [];
  
  for (const row of rows) {
    const rowSize = estimateRowSize(row);
    if (rowSize > MAX_ROW_SIZE) {
      largeRows.push(row);
    } else {
      // Validate row
      const validation = validateRow(row, notNullColumns, generatedColumns);
      if (validation.valid) {
        normalRows.push(row);
      } else {
        skippedValidation++;
        if (skippedValidation <= 3) {
          onLog('warn', `⚠️ Skipping row ${row.id}: ${validation.issues.join(', ')}`);
        }
      }
    }
  }
  
  if (skippedValidation > 3) {
    onLog('warn', `⚠️ Skipped ${skippedValidation} rows due to validation failures`);
  }
  
  // Process normal rows in bulk
  for (let i = 0; i < normalRows.length; i += bulkSize) {
    const chunk = normalRows.slice(i, i + bulkSize);
    
    try {
      // Get columns from first row, excluding generated columns
      const firstRow = chunk[0];
      const columns = Object.keys(firstRow).filter(c => 
        firstRow[c] !== undefined && 
        !generatedColumns.has(c)
      );
      
      if (columns.length === 0) {
        onLog('warn', `No insertable columns found for ${tableName}`);
        continue;
      }
      
      // Build multi-value INSERT
      const columnList = columns.map(c => `"${c}"`).join(', ');
      const valueSets: string[] = [];
      const allValues: (string | number | boolean | null)[] = [];
      let paramIndex = 1;
      
      for (const row of chunk) {
        const placeholders: string[] = [];
        for (const col of columns) {
          placeholders.push(`$${paramIndex++}`);
          allValues.push(row[col] as string | number | boolean | null);
        }
        valueSets.push(`(${placeholders.join(', ')})`);
      }
      
      // Build ON CONFLICT clause - update all columns except id
      const updateColumns = columns.filter(c => c !== 'id');
      const updateClause = updateColumns.length > 0
        ? `ON CONFLICT (id) DO UPDATE SET ${updateColumns.map(c => `"${c}" = EXCLUDED."${c}"`).join(', ')}`
        : 'ON CONFLICT (id) DO NOTHING';
      
      const sql = `
        INSERT INTO "${tableName}" (${columnList}) 
        VALUES ${valueSets.join(', ')}
        ${updateClause}
      `;
      
      const result = await (tx as { unsafe: (sql: string, params: unknown[]) => Promise<{ count: number }> }).unsafe(sql, allValues);
      inserted += result.count || chunk.length;
      
    } catch (error) {
      // If bulk insert fails, fall back to individual inserts with better error handling
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if it's a constraint violation
      const isConstraintViolation = message.toLowerCase().includes('constraint') ||
        message.toLowerCase().includes('unique') ||
        message.toLowerCase().includes('violates');
      
      if (isConstraintViolation) {
        onLog('warn', `⚠️ Constraint violation in bulk insert for ${tableName}, processing individually...`);
      } else {
        onLog('warn', `Bulk insert failed for ${tableName}: ${message}`);
      }
      
      for (const row of chunk) {
        try {
          const columns = Object.keys(row).filter(c => 
            row[c] !== undefined && 
            !generatedColumns.has(c)
          );
          const values = columns.map(c => row[c]) as (string | number | boolean | null)[];
          const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
          const columnListSingle = columns.map(c => `"${c}"`).join(', ');
          
          // Use ON CONFLICT DO UPDATE for individual inserts too
          const updateCols = columns.filter(c => c !== 'id');
          const updatePart = updateCols.length > 0
            ? `ON CONFLICT (id) DO UPDATE SET ${updateCols.map(c => `"${c}" = EXCLUDED."${c}"`).join(', ')}`
            : 'ON CONFLICT (id) DO NOTHING';
          
          await (tx as { unsafe: (sql: string, params: unknown[]) => Promise<unknown> }).unsafe(
            `INSERT INTO "${tableName}" (${columnListSingle}) VALUES (${placeholders}) ${updatePart}`,
            values
          );
          inserted++;
        } catch (rowError) {
          const rowMessage = rowError instanceof Error ? rowError.message : 'Unknown error';
          
          // Provide specific guidance based on error type
          if (rowMessage.toLowerCase().includes('unique')) {
            onLog('error', `❌ Unique constraint violation for row ${row.id} in ${tableName}`);
          } else if (rowMessage.toLowerCase().includes('check')) {
            onLog('error', `❌ CHECK constraint violation for row ${row.id}: ${rowMessage}`);
          } else if (rowMessage.toLowerCase().includes('foreign key')) {
            onLog('error', `❌ Foreign key violation for row ${row.id}: parent row may not exist`);
          } else if (rowMessage.toLowerCase().includes('not null')) {
            onLog('error', `❌ NOT NULL violation for row ${row.id}: ${rowMessage}`);
          } else {
            onLog('error', `❌ Failed to insert row ${row.id}: ${rowMessage}`);
          }
        }
      }
    }
  }
  
  // Process large rows individually with streaming
  if (largeRows.length > 0) {
    onLog('info', `📦 Processing ${largeRows.length} large row(s) individually...`);
    for (const row of largeRows) {
      try {
        const columns = Object.keys(row).filter(c => 
          row[c] !== undefined && 
          !generatedColumns.has(c)
        );
        const values = columns.map(c => row[c]) as (string | number | boolean | null)[];
        const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
        const columnListSingle = columns.map(c => `"${c}"`).join(', ');
        
        const updateCols = columns.filter(c => c !== 'id');
        const updatePart = updateCols.length > 0
          ? `ON CONFLICT (id) DO UPDATE SET ${updateCols.map(c => `"${c}" = EXCLUDED."${c}"`).join(', ')}`
          : 'ON CONFLICT (id) DO NOTHING';
        
        await (tx as { unsafe: (sql: string, params: unknown[]) => Promise<unknown> }).unsafe(
          `INSERT INTO "${tableName}" (${columnListSingle}) VALUES (${placeholders}) ${updatePart}`,
          values
        );
        inserted++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        onLog('error', `Failed to insert large row ${row.id}: ${message}`);
      }
    }
  }
  
  return inserted;
}

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
    batchSize = SYNC_CONFIG.defaultBatchSize, // Smaller batches for visible progress
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
    const tableNames = enabledTables.map(t => t.tableName);
    
    // Check for circular dependencies first
    onLog('info', 'Analyzing table dependencies...');
    const circularDeps = await detectCircularDependencies(targetConn, tableNames);
    
    if (circularDeps.length > 0) {
      onLog('warn', `⚠️ Circular FK dependencies detected: ${circularDeps.map(c => c.join(' ↔ ')).join(', ')}`);
      onLog('info', '🔧 Will attempt to defer FK constraints for affected tables');
      
      // Try to defer FK constraints for circular tables
      const circularTables = new Set(circularDeps.flat());
      for (const tableName of circularTables) {
        try {
          await deferForeignKeyConstraints(targetConn, tableName);
        } catch {
          onLog('warn', `Could not defer FK constraints for ${tableName} - constraints may not be DEFERRABLE`);
        }
      }
    }
    
    // Sort tables by FK dependency order to avoid constraint violations
    const orderedTableNames = await getTableSyncOrder(sourceConn, tableNames);
    
    // Check if order differs from original (indicates FK dependencies)
    const hasReordering = orderedTableNames.some((t, i) => t !== tableNames[i]);
    if (hasReordering) {
      onLog('info', `📋 Tables reordered by FK dependencies: ${orderedTableNames.join(' → ')}`);
    }
    
    // Reorder enabledTables to match FK order
    const orderedTables = orderedTableNames
      .map(name => enabledTables.find(t => t.tableName === name))
      .filter((t): t is typeof enabledTables[0] => t !== undefined);
    
    // Find starting point from checkpoint
    const startIndex = checkpoint?.lastTable
      ? orderedTables.findIndex((t) => t.tableName === checkpoint.lastTable)
      : 0;
    
    for (let i = Math.max(0, startIndex); i < orderedTables.length; i++) {
      const tableConfig = orderedTables[i];
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
        // Get row count for this table first
        const rowCountResult = await sourceConn.client.unsafe(
          `SELECT COUNT(*) as count FROM "${tableName}"`
        );
        const tableRowCount = parseInt(rowCountResult[0]?.count as string || '0', 10);
        onLog('info', `Table ${tableName} has ${tableRowCount.toLocaleString()} rows to process`);
        
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
        
        // Log detailed table completion summary
        const skipBreakdown: string[] = [];
        if (result.skippedReasons.alreadySynced > 0) skipBreakdown.push(`${result.skippedReasons.alreadySynced} already synced`);
        if (result.skippedReasons.error > 0) skipBreakdown.push(`${result.skippedReasons.error} errors`);
        if (result.skippedReasons.conflict > 0) skipBreakdown.push(`${result.skippedReasons.conflict} conflicts`);
        if (result.skippedReasons.noChanges > 0) skipBreakdown.push(`${result.skippedReasons.noChanges} no changes`);
        if (result.skippedReasons.noId > 0) skipBreakdown.push(`${result.skippedReasons.noId} missing id`);
        
        onLog('info', `✅ Completed: ${tableName} — ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped`);
        
        // Log skip breakdown if there were skips
        if (result.skipped > 0 && skipBreakdown.length > 0) {
          onLog('info', `   Skip breakdown: ${skipBreakdown.join(', ')}`);
        }
        
        // Log errors summary if there were errors
        if (result.errors.length > 0) {
          onLog('warn', `   ⚠️ ${result.errors.length} row error(s) in ${tableName}`);
          result.errors.slice(0, 5).forEach(err => {
            onLog('warn', `      - ${err}`);
          });
          if (result.errors.length > 5) {
            onLog('warn', `      ... and ${result.errors.length - 5} more errors`);
          }
        }
        
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const stack = error instanceof Error ? error.stack : undefined;
        
        onLog('error', `❌ Error syncing table "${tableName}": ${message}`, {
          table: tableName,
          error: message,
          stack: stack?.split('\n').slice(0, 5).join('\n'),
        });
        
        progress.errors++;
        onProgress(progress);
        
        // Save checkpoint for retry
        currentCheckpoint = {
          lastTable: tableName,
          lastRowId: '',
          lastUpdatedAt: new Date().toISOString(),
          processedTables,
        };
        
        // Continue to next table instead of stopping
        onLog('warn', `Skipping table "${tableName}" due to error, continuing with next table...`);
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
    const stack = error instanceof Error ? error.stack : undefined;
    onLog('error', `❌ Sync failed: ${message}`, { stack: stack?.split('\n').slice(0, 5).join('\n') });
    jobStartTimes.delete(jobId);
    onComplete(false, currentCheckpoint);
    throw error;
  } finally {
    // Clean up connections safely
    try {
      if (sourceConn) await sourceConn.close();
    } catch (e) {
      console.error('Error closing source connection:', e);
    }
    try {
      if (targetConn) await targetConn.close();
    } catch (e) {
      console.error('Error closing target connection:', e);
    }
    // Clean up job tracking
    cancelledJobs.delete(jobId);
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
  skippedReasons: {
    alreadySynced: number;    // Target is newer or same
    noChanges: number;        // No columns to update
    conflict: number;         // Two-way conflict
    error: number;            // Processing error
    noId: number;             // Row missing id
  };
  errors: string[];           // Detailed error messages
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
    skippedReasons: {
      alreadySynced: 0,
      noChanges: 0,
      conflict: 0,
      error: 0,
      noId: 0,
    },
    errors: [],
    conflicts: [],
    cancelled: false,
  };
  
  let currentAfterId = afterId;
  let hasMore = true;
  let processedRows = 0;
  let checkpointCounter = 0;
  let batchNumber = 0;
  
  // Collect table metadata for smarter sync
  onLog('info', `Analyzing table structure for ${tableName}...`);
  
  const [generatedColumns, triggers, uniqueConstraints, notNullColumns, checkConstraints] = await Promise.all([
    getGeneratedColumns(targetConn, tableName),
    getTableTriggers(targetConn, tableName),
    getUniqueConstraints(targetConn, tableName),
    getNotNullColumnsWithoutDefaults(targetConn, tableName),
    getCheckConstraints(targetConn, tableName),
  ]);
  
  // Build metadata object
  const metadata: TableSyncMetadata = {
    generatedColumns,
    uniqueConstraints,
    notNullColumns,
    checkConstraints,
    triggers,
    hasCircularDeps: false, // Will be set by parent if needed
  };
  
  // Log metadata summary
  if (generatedColumns.size > 0) {
    onLog('info', `⚙️ Generated columns (excluded): ${[...generatedColumns].join(', ')}`);
  }
  if (triggers.length > 0) {
    onLog('warn', `⚠️ Table has ${triggers.length} trigger(s) that may affect performance`);
  }
  if (uniqueConstraints.length > 1) { // > 1 because PK is always there
    const nonPkConstraints = uniqueConstraints.filter(c => !c.columns.includes('id') || c.columns.length > 1);
    if (nonPkConstraints.length > 0) {
      onLog('info', `🔑 Additional unique constraints: ${nonPkConstraints.map(c => `(${c.columns.join(', ')})`).join(', ')}`);
    }
  }
  if (checkConstraints.length > 0) {
    onLog('info', `✓ CHECK constraints: ${checkConstraints.length} (data will be validated)`);
  }
  
  onLog('info', `Starting batch processing for ${tableName}...`);
  
  while (hasMore) {
    batchNumber++;
    
    // Check for cancellation
    if (isSyncCancelled(jobId)) {
      onLog('warn', `Sync cancelled during ${tableName} processing`);
      result.cancelled = true;
      result.lastRowId = currentAfterId;
      cancelledJobs.delete(jobId);
      return result;
    }
    
    // Check for timeout
    if (isJobTimedOut(jobId)) {
      onLog('error', `Timeout during ${tableName} processing`);
      result.cancelled = true;
      result.lastRowId = currentAfterId;
      return result;
    }
    
    // Get batch of rows to sync with timeout
    onLog('info', `Fetching batch #${batchNumber} for ${tableName}...`);
    const batchStartTime = Date.now();
    
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
    
    const fetchDuration = Date.now() - batchStartTime;
    onLog('info', `Batch #${batchNumber}: fetched ${batch.rows.length} rows in ${fetchDuration}ms`);
    
    hasMore = batch.hasMore;
    currentAfterId = batch.lastId || currentAfterId;
    
    if (batch.rows.length === 0) {
      break;
    }
    
    // Separate rows into inserts and updates for bulk processing
    const rowsToInsert: Record<string, unknown>[] = [];
    const rowsToUpdate: { row: Record<string, unknown>; existing: Record<string, unknown> }[] = [];
    const rowsToSkip: { row: Record<string, unknown>; reason: string }[] = [];
    
    // First pass: categorize rows
    const existingIds = batch.rows.filter(r => r.id).map(r => r.id as string);
    let existingRowsMap = new Map<string, Record<string, unknown>>();
    
    if (existingIds.length > 0) {
      // Bulk check for existing rows
      const placeholders = existingIds.map((_, i) => `$${i + 1}`).join(', ');
      const existingResult = await targetConn.client.unsafe(
        `SELECT id, updated_at FROM "${tableName}" WHERE id IN (${placeholders})`,
        existingIds
      );
      existingRowsMap = new Map(existingResult.map(r => [r.id as string, r as Record<string, unknown>]));
    }
    
    for (const row of batch.rows) {
      if (!row.id) {
        result.skipped++;
        result.skippedReasons.noId++;
        rowsToSkip.push({ row, reason: 'missing_id' });
        continue;
      }
      
      const existing = existingRowsMap.get(row.id as string);
      
      if (!existing) {
        rowsToInsert.push(row);
      } else {
        rowsToUpdate.push({ row, existing });
      }
    }
    
    // Process batch within a transaction
    await targetConn.client.begin(async (tx) => {
      // BULK INSERTS - much faster than individual inserts
      if (rowsToInsert.length > 0) {
        const insertedCount = await bulkInsertRows(
          tx,
          tableName,
          rowsToInsert,
          generatedColumns,
          onLog,
          metadata // Pass metadata for validation
        );
        result.inserted += insertedCount;
        result.skipped += rowsToInsert.length - insertedCount;
        result.skippedReasons.error += rowsToInsert.length - insertedCount;
      }
      
      // UPDATES - still row by row due to conflict resolution logic
      for (const { row, existing } of rowsToUpdate) {
        try {
          // Handle update with conflict resolution
          // Safely parse dates, defaulting to epoch if invalid
          const sourceUpdatedAt = row.updated_at 
            ? new Date(row.updated_at as string) 
            : new Date(0);
          const targetUpdatedAt = existing.updated_at 
            ? new Date(existing.updated_at as string) 
            : new Date(0);
          
          // Handle invalid dates
          if (isNaN(sourceUpdatedAt.getTime())) {
            sourceUpdatedAt.setTime(Date.now());
          }
          if (isNaN(targetUpdatedAt.getTime())) {
            targetUpdatedAt.setTime(0);
          }
          
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
              result.skippedReasons.conflict++;
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
              result.skippedReasons.conflict++;
              continue;
            }
          }
          
          // Update existing row if source is newer (or if target has no updated_at)
          if (sourceUpdatedAt > targetUpdatedAt || !existing.updated_at) {
            // Filter out generated columns and undefined values
            const columns = Object.keys(row).filter((c) => 
              c !== 'id' && 
              row[c] !== undefined && 
              !generatedColumns.has(c)
            );
            if (columns.length === 0) {
              result.skipped++;
              result.skippedReasons.noChanges++;
              continue;
            }
            const values = columns.map((c) => row[c]) as (string | number | boolean | null)[];
            const setClause = columns.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
            
            await tx.unsafe(
              `UPDATE "${tableName}" SET ${setClause} WHERE id = $${columns.length + 1}`,
              [...values, row.id as string]
            );
            
            result.updated++;
          } else {
            // Target is already up-to-date or newer
            result.skipped++;
            result.skippedReasons.alreadySynced++;
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
          result.skipped++;
          result.skippedReasons.error++;
          
          // Store error details (limit to first 10)
          if (result.errors.length < 10) {
            result.errors.push(`${tableName}.${row.id}: ${message}`);
          }
          
          // Log errors in detail
          onLog('error', `❌ Error [${tableName}.${row.id}]: ${message}`);
          
          // Log row data for first few errors only
          if (result.skippedReasons.error <= 3) {
            const rowPreview = JSON.stringify(row).slice(0, 300);
            onLog('warn', `   Row data: ${rowPreview}${rowPreview.length >= 300 ? '...' : ''}`);
          }
        }
      }
      
      // Update processed count for this batch
      processedRows += batch.rows.length;
    });
    
    // Update progress
    onProgress({
      processedRows,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
    });
    
    // Log batch completion with skip breakdown
    const skipDetails: string[] = [];
    if (result.skippedReasons.alreadySynced > 0) skipDetails.push(`${result.skippedReasons.alreadySynced} up-to-date`);
    if (result.skippedReasons.error > 0) skipDetails.push(`${result.skippedReasons.error} errors`);
    if (result.skippedReasons.conflict > 0) skipDetails.push(`${result.skippedReasons.conflict} conflicts`);
    if (result.skippedReasons.noChanges > 0) skipDetails.push(`${result.skippedReasons.noChanges} no-changes`);
    if (result.skippedReasons.noId > 0) skipDetails.push(`${result.skippedReasons.noId} no-id`);
    
    const skipInfo = skipDetails.length > 0 ? ` [${skipDetails.join(', ')}]` : '';
    onLog('info', `Batch #${batchNumber}: ${result.inserted} ins, ${result.updated} upd, ${result.skipped} skip${skipInfo}`);
    
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

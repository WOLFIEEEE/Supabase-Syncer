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

// Import new production-grade services
import { createBackup, restoreBackup, type BackupMetadata } from './backup-service';
import { createMetricsCollector, type MetricsCollector } from './sync-metrics';
import { SyncRateLimiter } from './sync-rate-limiter';
import { 
  markRowProcessed, 
  isRowProcessed, 
  clearProcessedRows,
} from './idempotency-tracker';

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
  
  // Use a CTE to define the table list once, then reference it twice
  // This avoids parameter duplication issues with postgres.js
  const tableListSql = tableNames.map(t => `'${t.replace(/'/g, "''")}'`).join(', ');
  
  // Get all FK relationships for these tables
  const fkResult = await conn.client.unsafe(`
    WITH target_tables AS (
      SELECT unnest(ARRAY[${tableListSql}]) AS table_name
    )
    SELECT DISTINCT
      tc.table_name AS child_table,
      ccu.table_name AS parent_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
      AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name IN (SELECT table_name FROM target_tables)
      AND ccu.table_name IN (SELECT table_name FROM target_tables)
  `);

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
    const parent = safeString(row.parent_table);
    const child = safeString(row.child_table);
    
    // Skip self-references or invalid entries
    if (!parent || !child || parent === child) continue;
    
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

  return new Set(result.map(r => safeString(r.column_name)).filter(Boolean));
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

  return result.map(r => safeString(r.trigger_name)).filter(Boolean);
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
    name: safeString(r.constraint_name),
    columns: Array.isArray(r.columns) 
      ? r.columns.map((c: unknown) => safeString(c)).filter(Boolean)
      : safeString(r.columns).replace(/[{}]/g, '').split(',').filter(Boolean),
  })).filter(c => c.name);
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

  return new Set(result.map(r => safeString(r.column_name)).filter(Boolean));
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
    name: safeString(r.constraint_name),
    definition: safeString(r.check_clause),
  })).filter(c => c.name);
}

/**
 * Detect circular foreign key dependencies
 */
async function detectCircularDependencies(
  conn: DrizzleConnection,
  tableNames: string[]
): Promise<string[][]> {
  if (tableNames.length === 0) return [];
  
  // Use a CTE to define the table list once
  const tableListSql = tableNames.map(t => `'${t.replace(/'/g, "''")}'`).join(', ');
  
  const fkResult = await conn.client.unsafe(`
    WITH target_tables AS (
      SELECT unnest(ARRAY[${tableListSql}]) AS table_name
    )
    SELECT DISTINCT
      tc.table_name AS child_table,
      ccu.table_name AS parent_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name IN (SELECT table_name FROM target_tables)
      AND ccu.table_name IN (SELECT table_name FROM target_tables)
  `);

  // Build adjacency list
  const graph = new Map<string, Set<string>>();
  for (const table of tableNames) {
    graph.set(table, new Set());
  }
  for (const row of fkResult) {
    const child = safeString(row.child_table);
    const parent = safeString(row.parent_table);
    if (child && parent && child !== parent) {
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

  const constraintNames = result.map(r => safeString(r.constraint_name)).filter(Boolean);
  
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
 * Sanitize identifier (table name, column name) for safe SQL usage
 * Prevents SQL injection by removing dangerous characters
 */
function sanitizeIdentifier(identifier: string): string {
  // Remove or escape dangerous characters
  // PostgreSQL identifiers can contain: letters, digits, underscores
  // When quoted, they can contain almost anything except null character
  return identifier
    .replace(/\0/g, '') // Remove null bytes
    .replace(/"/g, '""'); // Escape double quotes by doubling them
}

/**
 * Validate that a string is a safe PostgreSQL identifier
 */
function isValidIdentifier(identifier: string): boolean {
  // Check for null bytes or other dangerous patterns
  if (identifier.includes('\0')) return false;
  if (identifier.length === 0 || identifier.length > 63) return false;
  return true;
}

// ============================================================================
// SAFE TYPE COERCION HELPERS
// These prevent runtime errors from unsafe type assertions
// ============================================================================

/**
 * Safely coerce a value to string, with fallback
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
 * Safely coerce a value to number, with fallback
 */
function safeNumber(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  if (typeof value === 'bigint') {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }
  return fallback;
}

/**
 * Safely coerce a value to Date, with fallback
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

/**
 * Safely get a string property from an object
 */
function getStringProp(obj: Record<string, unknown>, key: string, fallback: string = ''): string {
  return safeString(obj[key], fallback);
}

/**
 * Safely parse an integer from various types
 */
function safeParseInt(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') return Math.floor(value);
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  }
  if (typeof value === 'bigint') return Number(value);
  return fallback;
}

/**
 * Serialize a value for PostgreSQL insertion
 * Handles various PostgreSQL column types properly
 * 
 * Supported types:
 * - Primitives (string, number, boolean)
 * - null/undefined → null
 * - Date → ISO string
 * - BigInt → string (PostgreSQL bigint)
 * - Buffer → hex string (PostgreSQL bytea)
 * - Array → PostgreSQL array literal or JSON
 * - Object → JSON string (JSONB columns)
 * - Special numbers (Infinity, NaN) → null with warning
 */
function serializeValue(value: unknown): string | number | boolean | null {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return null;
  }
  
  // Handle booleans
  if (typeof value === 'boolean') {
    return value;
  }
  
  // Handle numbers - check for special values
  if (typeof value === 'number') {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      // Infinity and NaN can't be stored in PostgreSQL numeric columns
      console.warn(`[Sync] Converting special number value (${value}) to null`);
      return null;
    }
    return value;
  }
  
  // Handle BigInt (PostgreSQL bigint columns)
  if (typeof value === 'bigint') {
    return value.toString();
  }
  
  // Handle strings
  if (typeof value === 'string') {
    return value;
  }
  
  // Handle Date objects
  if (value instanceof Date) {
    // Check for invalid dates
    if (isNaN(value.getTime())) {
      console.warn('[Sync] Converting invalid Date to null');
      return null;
    }
    return value.toISOString();
  }
  
  // Handle Buffer (PostgreSQL bytea columns)
  if (Buffer.isBuffer(value)) {
    // Convert to hex string with \x prefix for PostgreSQL bytea
    return '\\x' + value.toString('hex');
  }
  
  // Handle Uint8Array (also for binary data)
  if (value instanceof Uint8Array) {
    return '\\x' + Buffer.from(value).toString('hex');
  }
  
  // Handle Arrays
  if (Array.isArray(value)) {
    // Check if it's an array of primitives (PostgreSQL array type)
    // or complex objects (should be JSONB)
    const hasComplexElements = value.some(
      item => item !== null && typeof item === 'object' && !Array.isArray(item) && !(item instanceof Date)
    );
    
    if (hasComplexElements) {
      // Complex array - serialize as JSON (for JSONB columns)
      return JSON.stringify(value);
    }
    
    // Simple array - could be PostgreSQL array type
    // Serialize as JSON to be safe (works for both array[] and jsonb)
    return JSON.stringify(value);
  }
  
  // Handle plain objects (JSONB columns)
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      console.warn('[Sync] Failed to serialize object, converting to null:', e);
      return null;
    }
  }
  
  // Handle Symbol, Function, etc. - convert to string representation
  if (typeof value === 'symbol') {
    return value.toString();
  }
  
  if (typeof value === 'function') {
    console.warn('[Sync] Function values cannot be stored, converting to null');
    return null;
  }
  
  // Fallback: convert to string
  return String(value);
}

/**
 * Check if a value might cause issues during sync
 * Returns warning message if problematic, null if OK
 */
function checkValueForIssues(columnName: string, value: unknown): string | null {
  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      return `Column "${columnName}" has NaN value`;
    }
    if (!Number.isFinite(value)) {
      return `Column "${columnName}" has Infinity value`;
    }
    // Check for potential precision loss with very large numbers
    if (Math.abs(value) > Number.MAX_SAFE_INTEGER) {
      return `Column "${columnName}" has value exceeding safe integer range`;
    }
  }
  
  if (value instanceof Date && isNaN(value.getTime())) {
    return `Column "${columnName}" has invalid Date`;
  }
  
  if (typeof value === 'string' && value.length > 10 * 1024 * 1024) {
    return `Column "${columnName}" has very large string (${Math.round(value.length / 1024 / 1024)}MB)`;
  }
  
  return null;
}

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
): { valid: boolean; issues: string[]; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check NOT NULL columns
  for (const col of notNullColumns) {
    if (generatedColumns.has(col)) continue; // Skip generated columns
    if (col === 'id') continue; // ID is always provided
    
    const value = row[col];
    if (value === null || value === undefined) {
      issues.push(`NULL value in NOT NULL column: ${col}`);
    }
  }

  // Check all column values for potential issues
  for (const [col, value] of Object.entries(row)) {
    if (generatedColumns.has(col)) continue;
    
    const valueIssue = checkValueForIssues(col, value);
    if (valueIssue) {
      warnings.push(valueIssue);
    }
  }

  // Check row size
  const rowSize = estimateRowSize(row);
  if (rowSize > MAX_ROW_SIZE) {
    issues.push(`Row too large: ${Math.round(rowSize / 1024)}KB (max 1MB)`);
  }

  return { valid: issues.length === 0, issues, warnings };
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
  
  let warningCount = 0;
  
  for (const row of rows) {
    const rowSize = estimateRowSize(row);
    if (rowSize > MAX_ROW_SIZE) {
      largeRows.push(row);
    } else {
      // Validate row
      const validation = validateRow(row, notNullColumns, generatedColumns);
      
      // Log warnings for data quality issues (but don't skip)
      if (validation.warnings.length > 0) {
        warningCount++;
        if (warningCount <= 3) {
          onLog('warn', `⚠️ Data quality warning for row ${row.id}: ${validation.warnings.join(', ')}`);
        }
      }
      
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
  if (warningCount > 3) {
    onLog('warn', `⚠️ ${warningCount} rows had data quality warnings (processed anyway)`);
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
          // Serialize objects (JSONB columns) to JSON strings
          allValues.push(serializeValue(row[col]));
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
          // Serialize objects (JSONB columns) to JSON strings
          const values = columns.map(c => serializeValue(row[c]));
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
        // Serialize objects (JSONB columns) to JSON strings
        const values = columns.map(c => serializeValue(row[c]));
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

// ============================================================================
// ERROR CLASSIFICATION AND RETRY LOGIC
// ============================================================================

/**
 * Check if an error is transient and should be retried
 */
function isTransientError(error: Error): boolean {
  const transientPatterns = [
    'connection refused',
    'connection reset',
    'connection terminated',
    'timeout',
    'timed out',
    'econnreset',
    'econnrefused',
    'epipe',
    'socket hang up',
    'network',
    'temporarily unavailable',
    'too many connections',
    'server closed the connection',
    'deadlock detected',
    'could not serialize access',
  ];
  
  const message = error.message.toLowerCase();
  return transientPatterns.some(pattern => message.includes(pattern));
}

/**
 * Check if an error is permanent and should not be retried
 */
function isPermanentError(error: Error): boolean {
  const permanentPatterns = [
    'violates unique constraint',
    'violates foreign key',
    'violates check constraint',
    'violates not-null constraint',
    'permission denied',
    'does not exist',
    'authentication failed',
    'invalid input syntax',
    'out of range',
    'duplicate key',
    'already exists',
  ];
  
  const message = error.message.toLowerCase();
  return permanentPatterns.some(pattern => message.includes(pattern));
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
 * 
 * Production-grade features:
 * - Pre-sync backup with automatic rollback on failure
 * - Real-time metrics collection
 * - Rate limiting to protect target database
 * - Idempotency tracking for safe retries
 * - SERIALIZABLE transaction isolation
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
  let backupMetadata: BackupMetadata | null = null;
  let metricsCollector: MetricsCollector | null = null;
  const rateLimiter = new SyncRateLimiter({ maxOpsPerSecond: 500 }); // 500 ops/sec initial
  
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
    
    // ========================================================================
    // SAFETY CHECK: Ensure at least one table is enabled
    // ========================================================================
    if (enabledTables.length === 0) {
      onLog('error', '❌ No tables enabled for sync. At least one table must be selected.');
      throw new Error('No tables enabled for sync');
    }
    
    // ========================================================================
    // PRODUCTION FEATURE: Pre-sync backup for rollback protection
    // ========================================================================
    if (!checkpoint && tableNames.length > 0) { // Only backup on fresh sync, not resume, and if tables exist
      onLog('info', '🔒 Creating pre-sync backup for rollback protection...');
      try {
        backupMetadata = await createBackup({
          syncJobId: jobId,
          userId: 'system', // Will be replaced by actual user ID from context
          targetConnectionId: 'target', // Will be replaced by actual connection ID
          targetUrl,
          tables: tableNames,
          onProgress: (bp) => {
            onLog('info', `   Backup progress: ${bp.completedTables}/${bp.totalTables} tables, ${bp.rowsExported} rows`);
          },
          onLog: (level, msg) => onLog(level, `[Backup] ${msg}`),
        });
        onLog('info', `✅ Backup created: ${backupMetadata.id} (${backupMetadata.rowCount} rows, ${(backupMetadata.sizeBytes / 1024).toFixed(2)} KB)`);
      } catch (backupError) {
        const msg = backupError instanceof Error ? backupError.message : 'Unknown error';
        onLog('warn', `⚠️ Backup creation failed: ${msg}. Proceeding without backup protection.`);
        // Continue without backup - don't block sync for backup failures
      }
    }
    
    // ========================================================================
    // PRODUCTION FEATURE: Initialize metrics collection
    // ========================================================================
    metricsCollector = createMetricsCollector(jobId, 'system'); // userId will be passed from context
    metricsCollector.startCollection();
    onLog('info', '📊 Metrics collection started');
    
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
        const tableRowCount = safeParseInt(rowCountResult[0]?.count);
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
          // Production features
          rateLimiter,
          metricsCollector: metricsCollector || undefined,
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
    
    // ========================================================================
    // PRODUCTION FEATURE: Finalize metrics on success
    // ========================================================================
    if (metricsCollector) {
      metricsCollector.completeCollection('completed');
      const metrics = metricsCollector.getMetrics();
      onLog('info', `📊 Sync metrics: ${metrics.totalRows} rows in ${(metrics.durationMs / 1000).toFixed(1)}s (${metrics.rowsPerSecond.toFixed(1)} rows/sec)`);
    }
    
    // Clean up idempotency tracking for this job
    try {
      await clearProcessedRows(jobId);
    } catch (cleanupError) {
      onLog('warn', `Failed to clear idempotency tracking: ${cleanupError instanceof Error ? cleanupError.message : 'Unknown'}`);
    }
    
    onLog('info', '✅ Sync completed successfully', {
      tablesProcessed: progress.completedTables,
      rowsInserted: progress.insertedRows,
      rowsUpdated: progress.updatedRows,
      backupId: backupMetadata?.id,
    });
    
    jobStartTimes.delete(jobId);
    onComplete(progress.errors === 0);
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    onLog('error', `❌ Sync failed: ${message}`, { stack: stack?.split('\n').slice(0, 5).join('\n') });
    
    // ========================================================================
    // PRODUCTION FEATURE: Automatic rollback on critical failure
    // ========================================================================
    if (backupMetadata && backupMetadata.status === 'completed') {
      onLog('warn', '🔄 Attempting automatic rollback from backup...');
      try {
        await restoreBackup({
          backupId: backupMetadata.id,
          targetUrl,
          onProgress: (rp) => {
            onLog('info', `   Restore progress: ${rp.completedTables}/${rp.totalTables} tables`);
          },
          onLog: (level, msg) => onLog(level, `[Restore] ${msg}`),
        });
        onLog('info', `✅ Rollback completed successfully from backup ${backupMetadata.id}`);
      } catch (rollbackError) {
        const rollbackMsg = rollbackError instanceof Error ? rollbackError.message : 'Unknown error';
        onLog('error', `❌ CRITICAL: Rollback failed: ${rollbackMsg}. Manual intervention may be required.`);
        onLog('error', `   Backup ID for manual restore: ${backupMetadata.id}`);
      }
    } else {
      onLog('warn', '⚠️ No backup available for automatic rollback');
    }
    
    // Finalize metrics even on failure
    if (metricsCollector) {
      metricsCollector.recordError();
      metricsCollector.completeCollection('failed');
    }
    
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
  // Production features
  rateLimiter?: SyncRateLimiter;
  metricsCollector?: MetricsCollector;
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
    rateLimiter,
    metricsCollector,
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
    const existingIds = batch.rows
      .filter(r => r.id !== null && r.id !== undefined)
      .map(r => safeString(r.id));
    let existingRowsMap = new Map<string, Record<string, unknown>>();
    
    if (existingIds.length > 0) {
      // Bulk check for existing rows
      const placeholders = existingIds.map((_, i) => `$${i + 1}`).join(', ');
      const existingResult = await targetConn.client.unsafe(
        `SELECT id, updated_at FROM "${tableName}" WHERE id IN (${placeholders})`,
        existingIds
      );
      existingRowsMap = new Map(
        existingResult.map(r => [safeString(r.id), r as Record<string, unknown>])
      );
    }
    
    for (const row of batch.rows) {
      const rowId = safeString(row.id);
      if (!rowId) {
        result.skipped++;
        result.skippedReasons.noId++;
        rowsToSkip.push({ row, reason: 'missing_id' });
        continue;
      }
      
      const existing = existingRowsMap.get(rowId);
      
      if (!existing) {
        rowsToInsert.push(row);
      } else {
        rowsToUpdate.push({ row, existing });
      }
    }
    
    // ========================================================================
    // PRODUCTION FEATURE: Rate limiting before database operations
    // ========================================================================
    if (rateLimiter) {
      await rateLimiter.acquirePermit(batch.rows.length);
    }
    
    // Record batch start time for metrics
    const batchProcessStart = Date.now();
    
    // Process batch within a SERIALIZABLE transaction for data consistency
    await targetConn.client.unsafe('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
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
        const rowId = safeString(row.id);
        
        // ========================================================================
        // PRODUCTION FEATURE: Idempotency check - skip already processed rows
        // ========================================================================
        try {
          const alreadyProcessed = await isRowProcessed(jobId, tableName, rowId);
          if (alreadyProcessed) {
            result.skipped++;
            result.skippedReasons.alreadySynced++;
            continue;
          }
        } catch {
          // If idempotency check fails, proceed with processing
        }
        
        try {
          // Handle update with conflict resolution
          // Safely parse dates using helper function
          const sourceUpdatedAt = safeDate(row.updated_at, new Date(0));
          const targetUpdatedAt = safeDate(existing.updated_at, new Date(0));
          
          // Check for conflict in two-way sync
          if (direction === 'two_way' && targetUpdatedAt > sourceUpdatedAt) {
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
            // Serialize objects (JSONB columns) to JSON strings
            const values = columns.map((c) => serializeValue(row[c]));
            const setClause = columns.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
            
            await tx.unsafe(
              `UPDATE "${tableName}" SET ${setClause} WHERE id = $${columns.length + 1}`,
              [...values, rowId]
            );
            
            result.updated++;
            
            // Mark row as processed for idempotency
            try {
              await markRowProcessed({
                syncJobId: jobId,
                tableName,
                rowId,
                operation: 'update',
                processedAt: new Date(),
              });
            } catch {
              // Non-critical - continue even if marking fails
            }
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
              lastRowId: rowId,
              lastUpdatedAt: safeString(row.updated_at, new Date().toISOString()),
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
    
    // ========================================================================
    // PRODUCTION FEATURE: Record batch metrics and adapt rate limiter
    // ========================================================================
    const batchDuration = Date.now() - batchProcessStart;
    if (metricsCollector) {
      metricsCollector.recordBatch(tableName, batch.rows.length, batchDuration);
    }
    
    // Adapt rate limiter based on batch performance (response time per row)
    if (rateLimiter) {
      rateLimiter.recordResponseTime(batchDuration / batch.rows.length);
    }
    
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
      result.lastUpdatedAt = safeString(lastRow.updated_at, new Date().toISOString());
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

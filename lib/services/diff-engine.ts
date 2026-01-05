import { createDrizzleClient, type DrizzleConnection } from './drizzle-factory';
import { areTypesCompatible } from './schema-inspector';
import type { TableDiff, SchemaDiff, ColumnDiff } from '@/types';

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
 * Safely parse an integer
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

export interface DiffOptions {
  sourceUrl: string;
  targetUrl: string;
  tables: string[];
  since?: Date; // Only get changes after this timestamp
  sampleSize?: number; // Number of sample rows to include
}

export interface DiffResult {
  tables: TableDiff[];
  schemaIssues: SchemaDiff[];
  totalInserts: number;
  totalUpdates: number;
}

/**
 * Calculate differences between source and target databases
 */
export async function calculateDiff(options: DiffOptions): Promise<DiffResult> {
  const { sourceUrl, targetUrl, tables, since, sampleSize = 5 } = options;
  
  let sourceConn: DrizzleConnection | null = null;
  let targetConn: DrizzleConnection | null = null;
  
  try {
    sourceConn = createDrizzleClient(sourceUrl);
    targetConn = createDrizzleClient(targetUrl);
    
    const tableDiffs: TableDiff[] = [];
    const schemaIssues: SchemaDiff[] = [];
    let totalInserts = 0;
    let totalUpdates = 0;
    
    for (const tableName of tables) {
      // Check schema compatibility
      const schemaIssue = await checkSchemaCompatibility(
        sourceConn,
        targetConn,
        tableName
      );
      
      if (schemaIssue) {
        schemaIssues.push(schemaIssue);
        
        // If table is missing entirely, skip diff calculation
        if (schemaIssue.missingInSource || schemaIssue.missingInTarget) {
          continue;
        }
      }
      
      // Calculate row differences
      const diff = await calculateTableDiff(
        sourceConn,
        targetConn,
        tableName,
        since,
        sampleSize
      );
      
      tableDiffs.push(diff);
      totalInserts += diff.inserts;
      totalUpdates += diff.updates;
    }
    
    return {
      tables: tableDiffs,
      schemaIssues,
      totalInserts,
      totalUpdates,
    };
  } finally {
    if (sourceConn) await sourceConn.close();
    if (targetConn) await targetConn.close();
  }
}

/**
 * Check if table schemas are compatible between source and target
 */
async function checkSchemaCompatibility(
  sourceConn: DrizzleConnection,
  targetConn: DrizzleConnection,
  tableName: string
): Promise<SchemaDiff | null> {
  // Get columns from both databases
  const [sourceColumns, targetColumns] = await Promise.all([
    getTableColumns(sourceConn, tableName),
    getTableColumns(targetConn, tableName),
  ]);
  
  // Check if table exists in both
  if (sourceColumns.length === 0 && targetColumns.length === 0) {
    return null; // Table doesn't exist in either
  }
  
  if (sourceColumns.length === 0) {
    return {
      tableName,
      missingInSource: true,
      missingInTarget: false,
      columnDifferences: [],
    };
  }
  
  if (targetColumns.length === 0) {
    return {
      tableName,
      missingInSource: false,
      missingInTarget: true,
      columnDifferences: [],
    };
  }
  
  // Compare columns
  const columnDifferences: ColumnDiff[] = [];
  const sourceColMap = new Map(sourceColumns.map((c) => [c.name, c]));
  const targetColMap = new Map(targetColumns.map((c) => [c.name, c]));
  
  // Check for missing columns in target
  for (const [name, sourceCol] of sourceColMap) {
    const targetCol = targetColMap.get(name);
    if (!targetCol) {
      columnDifferences.push({
        columnName: name,
        sourceType: sourceCol.type,
        targetType: null,
        issue: 'missing_in_target',
      });
    } else {
      // Use the enhanced type compatibility check
      const typesCompatible = areTypesCompatible(sourceCol.udtName, targetCol.udtName);
      if (!typesCompatible) {
        columnDifferences.push({
          columnName: name,
          sourceType: sourceCol.type,
          targetType: targetCol.type,
          issue: 'type_mismatch',
        });
      }
    }
  }
  
  // Check for missing columns in source (only if NOT NULL in target)
  for (const [name, targetCol] of targetColMap) {
    if (!sourceColMap.has(name)) {
      columnDifferences.push({
        columnName: name,
        sourceType: null,
        targetType: targetCol.type,
        issue: 'missing_in_source',
      });
    }
  }
  
  if (columnDifferences.length === 0) {
    return null;
  }
  
  return {
    tableName,
    missingInSource: false,
    missingInTarget: false,
    columnDifferences,
  };
}

/**
 * Get table columns with extended metadata
 */
async function getTableColumns(
  conn: DrizzleConnection,
  tableName: string
): Promise<{ name: string; type: string; udtName: string; isNullable: boolean }[]> {
  try {
    const result = await conn.client`
      SELECT 
        column_name, 
        data_type,
        udt_name,
        is_nullable = 'YES' as is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
      ORDER BY ordinal_position
    `;
    
    return result.map((row) => ({
      name: safeString(row.column_name),
      type: safeString(row.data_type),
      udtName: safeString(row.udt_name),
      isNullable: row.is_nullable === true || row.is_nullable === 'YES',
    })).filter(col => col.name); // Filter out entries without valid names
  } catch (error) {
    console.error(`Error getting columns for table: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

/**
 * Calculate differences for a single table
 */
async function calculateTableDiff(
  sourceConn: DrizzleConnection,
  targetConn: DrizzleConnection,
  tableName: string,
  since?: Date,
  sampleSize: number = 5
): Promise<TableDiff> {
  // Get row counts
  const [sourceCount, targetCount] = await Promise.all([
    getRowCount(sourceConn, tableName),
    getRowCount(targetConn, tableName),
  ]);
  
  // Find rows that need to be inserted (exist in source but not in target)
  const insertQuery = since
    ? `
      SELECT s.* FROM "${tableName}" s
      LEFT JOIN "${tableName}" t ON s.id = t.id
      WHERE t.id IS NULL AND s.updated_at >= $1
      ORDER BY s.updated_at DESC
      LIMIT $2
    `
    : `
      SELECT s.* FROM "${tableName}" s
      LEFT JOIN "${tableName}" t ON s.id = t.id
      WHERE t.id IS NULL
      ORDER BY s.updated_at DESC
      LIMIT $1
    `;
  
  // For cross-database comparison, we need to do this differently
  // Get source IDs first
  const sourceIdsResult = since
    ? await sourceConn.client.unsafe(
        `SELECT id FROM "${tableName}" WHERE updated_at >= $1`,
        [since.toISOString()]
      )
    : await sourceConn.client.unsafe(`SELECT id FROM "${tableName}"`);
  
  const sourceIds = new Set(sourceIdsResult.map((r) => r.id));
  
  // Get target IDs
  const targetIdsResult = await targetConn.client.unsafe(
    `SELECT id FROM "${tableName}"`
  );
  const targetIds = new Set(targetIdsResult.map((r) => r.id));
  
  // Calculate inserts (in source but not in target)
  const insertIds = [...sourceIds].filter((id) => !targetIds.has(id));
  
  // Get sample insert rows
  let sampleInserts: Record<string, unknown>[] = [];
  if (insertIds.length > 0) {
    const sampleIds = insertIds.slice(0, sampleSize);
    const placeholders = sampleIds.map((_, i) => `$${i + 1}`).join(', ');
    const insertSampleResult = await sourceConn.client.unsafe(
      `SELECT * FROM "${tableName}" WHERE id IN (${placeholders}) LIMIT ${sampleSize}`,
      sampleIds
    );
    sampleInserts = insertSampleResult as Record<string, unknown>[];
  }
  
  // Find rows that need to be updated (exist in both but source is newer)
  const commonIds = [...sourceIds].filter((id) => targetIds.has(id));
  let updateCount = 0;
  const sampleUpdates: Record<string, unknown>[] = [];
  
  if (commonIds.length > 0) {
    // Check for updates in batches
    const batchSize = 1000;
    for (let i = 0; i < commonIds.length; i += batchSize) {
      const batch = commonIds.slice(i, i + batchSize);
      const placeholders = batch.map((_, idx) => `$${idx + 1}`).join(', ');
      
      // Get source timestamps
      const sourceTimestamps = await sourceConn.client.unsafe(
        `SELECT id, updated_at FROM "${tableName}" WHERE id IN (${placeholders})`,
        batch
      );
      
      // Get target timestamps
      const targetTimestamps = await targetConn.client.unsafe(
        `SELECT id, updated_at FROM "${tableName}" WHERE id IN (${placeholders})`,
        batch
      );
      
      const targetTimestampMap = new Map(
        targetTimestamps.map((r) => {
          const timestamp = r.updated_at ? new Date(r.updated_at as string) : new Date(0);
          return [r.id, isNaN(timestamp.getTime()) ? new Date(0) : timestamp];
        })
      );
      
      for (const row of sourceTimestamps) {
        // Safely parse date, default to epoch if invalid
        const rawSourceTime = row.updated_at ? new Date(row.updated_at as string) : new Date(0);
        const sourceTime = isNaN(rawSourceTime.getTime()) ? new Date(0) : rawSourceTime;
        const targetTime = targetTimestampMap.get(row.id);
        
        if (targetTime && sourceTime > targetTime) {
          updateCount++;
          
          if (sampleUpdates.length < sampleSize) {
            const fullRow = await sourceConn.client.unsafe(
              `SELECT * FROM "${tableName}" WHERE id = $1`,
              [row.id]
            );
            if (fullRow[0]) {
              sampleUpdates.push(fullRow[0] as Record<string, unknown>);
            }
          }
        }
      }
    }
  }
  
  return {
    tableName,
    inserts: insertIds.length,
    updates: updateCount,
    sourceRowCount: sourceCount,
    targetRowCount: targetCount,
    sampleInserts,
    sampleUpdates,
  };
}

/**
 * Get row count for a table
 */
async function getRowCount(conn: DrizzleConnection, tableName: string): Promise<number> {
  try {
    const result = await conn.client.unsafe(
      `SELECT COUNT(*) as count FROM "${tableName}"`
    );
    return safeParseInt(result[0]?.count);
  } catch (error) {
    console.error(`Error getting row count for ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return 0;
  }
}

/**
 * Get rows that need to be synced from source to target
 */
export async function getRowsToSync(
  sourceConn: DrizzleConnection,
  targetConn: DrizzleConnection,
  tableName: string,
  since?: Date,
  afterId?: string,
  batchSize: number = 1000
): Promise<{
  rows: Record<string, unknown>[];
  hasMore: boolean;
  lastId: string | null;
}> {
  // Build query for source rows
  let query = `SELECT * FROM "${tableName}"`;
  const params: (string | Date)[] = [];
  const conditions: string[] = [];
  
  if (since) {
    params.push(since.toISOString());
    conditions.push(`updated_at >= $${params.length}`);
  }
  
  if (afterId) {
    params.push(afterId);
    conditions.push(`id > $${params.length}`);
  }
  
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  query += ` ORDER BY id ASC LIMIT ${batchSize + 1}`;
  
  const rows = await sourceConn.client.unsafe(query, params);
  
  const hasMore = rows.length > batchSize;
  const resultRows = hasMore ? rows.slice(0, batchSize) : rows;
  const lastRow = resultRows.length > 0 ? resultRows[resultRows.length - 1] : null;
  const lastId = lastRow ? safeString(lastRow.id) || null : null;
  
  return {
    rows: resultRows as Record<string, unknown>[],
    hasMore,
    lastId,
  };
}


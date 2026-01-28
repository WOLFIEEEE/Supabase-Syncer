/**
 * Schema Inspector Service
 * 
 * Provides comprehensive schema inspection for PostgreSQL databases.
 * Extracts columns, primary keys, foreign keys, constraints, and indexes.
 * 
 * OPTIMIZED: Uses bulk queries to fetch all schema info in ~6 queries total
 * instead of 6 queries per table (e.g., 252 queries → 6 queries for 42 tables)
 */

import { createDrizzleClient, type DrizzleConnection } from './drizzle-factory';
import type {
  DetailedColumn,
  ForeignKey,
  TableConstraint,
  TableIndex,
  DetailedTableSchema,
  DatabaseSchema,
  EnumType,
} from '@/types';
import { logger } from '@/lib/services/logger';

/**
 * Inspect the full schema of a database - OPTIMIZED VERSION
 * Uses bulk queries to fetch all data at once instead of per-table queries
 */
export async function inspectDatabaseSchema(databaseUrl: string): Promise<DatabaseSchema> {
  let connection: DrizzleConnection | null = null;
  
  try {
    connection = createDrizzleClient(databaseUrl);
    
    logger.info('Schema Inspector: Starting optimized bulk inspection');
    const startTime = Date.now();
    
    // Run ALL bulk queries in parallel for maximum speed
    const [
      versionResult,
      enums,
      tableNames,
      allColumns,
      allPrimaryKeys,
      allForeignKeys,
      allConstraints,
      allIndexes,
      allStats,
    ] = await Promise.all([
      connection.client`SELECT version()`,
      getEnumTypes(connection),
      getTableNames(connection),
      getAllColumns(connection),
      getAllPrimaryKeys(connection),
      getAllForeignKeys(connection),
      getAllConstraints(connection),
      getAllIndexes(connection),
      getAllTableStats(connection),
    ]);
    
    const version = (versionResult[0]?.version as string) || 'Unknown';
    
    logger.info('Schema Inspector: Bulk queries completed', { durationMs: Date.now() - startTime });
    logger.info('Schema Inspector: Processing tables', { tableCount: tableNames.length });
    
    // Build lookup maps for O(1) access
    const columnsMap = groupByTable(allColumns, 'table_name');
    const pkMap = groupByTable(allPrimaryKeys, 'table_name');
    const fkMap = groupByTable(allForeignKeys, 'table_name');
    const constraintsMap = groupByTable(allConstraints, 'table_name');
    const indexesMap = groupByTable(allIndexes, 'table_name');
    const statsMap = new Map(allStats.map(s => [s.table_name as string, s]));
    
    // Assemble tables from pre-fetched data (no more DB queries!)
    const tables: DetailedTableSchema[] = [];
    const syncableTables: string[] = [];
    
    for (const tableName of tableNames) {
      const columns = buildColumns(columnsMap.get(tableName) || []);
      const primaryKey = buildPrimaryKey(pkMap.get(tableName) || []);
      
      // Mark primary key columns
      if (primaryKey) {
        for (const col of columns) {
          col.isPrimaryKey = primaryKey.columns.includes(col.name);
        }
      }
      
      const foreignKeys = buildForeignKeys(fkMap.get(tableName) || []);
      const constraints = buildConstraints(constraintsMap.get(tableName) || []);
      const indexes = buildIndexes(indexesMap.get(tableName) || []);
      const stats = statsMap.get(tableName);
      
      const tableSchema: DetailedTableSchema = {
        tableName,
        columns,
        primaryKey,
        foreignKeys,
        constraints,
        indexes,
        rowCount: parseInt(stats?.estimated_rows as string || '0', 10),
        estimatedSize: (stats?.size as string) || 'Unknown',
      };
      
      tables.push(tableSchema);
      
      // Check if table is syncable (has id UUID and updated_at timestamp)
      const hasIdColumn = columns.some(
        (col) => col.name === 'id' && (col.udtName === 'uuid' || col.dataType === 'uuid')
      );
      const hasUpdatedAt = columns.some(
        (col) => col.name === 'updated_at' && 
          (col.udtName === 'timestamptz' || col.udtName === 'timestamp' || 
           col.dataType.includes('timestamp'))
      );
      
      if (hasIdColumn && hasUpdatedAt) {
        syncableTables.push(tableName);
      }
    }
    
    logger.info('Schema Inspector: Total time', { durationMs: Date.now() - startTime });
    
    return {
      tables,
      enums,
      syncableTables,
      version,
      inspectedAt: new Date(),
    };
    
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// ============================================================================
// BULK QUERY FUNCTIONS - Fetch all data for all tables in single queries
// ============================================================================

/**
 * Get all table names in one query
 */
async function getTableNames(connection: DrizzleConnection): Promise<string[]> {
  const result = await connection.client`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE 'pg_%'
      AND table_name NOT LIKE '_prisma_%'
      AND table_name NOT LIKE 'drizzle_%'
    ORDER BY table_name
  `;
  return result.map((row) => row.table_name as string);
}

/**
 * Get ALL columns for ALL tables in one query
 */
async function getAllColumns(connection: DrizzleConnection): Promise<Record<string, unknown>[]> {
  return connection.client`
    SELECT 
      c.table_name,
      c.column_name,
      c.data_type,
      c.udt_name,
      c.is_nullable = 'YES' as is_nullable,
      c.column_default,
      c.character_maximum_length,
      c.numeric_precision,
      c.ordinal_position
    FROM information_schema.columns c
    JOIN information_schema.tables t 
      ON c.table_name = t.table_name AND c.table_schema = t.table_schema
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND c.table_name NOT LIKE 'pg_%'
      AND c.table_name NOT LIKE '_prisma_%'
      AND c.table_name NOT LIKE 'drizzle_%'
    ORDER BY c.table_name, c.ordinal_position
  `;
}

/**
 * Get ALL primary keys for ALL tables in one query
 */
async function getAllPrimaryKeys(connection: DrizzleConnection): Promise<Record<string, unknown>[]> {
  return connection.client`
    SELECT 
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      kcu.ordinal_position
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name NOT LIKE 'pg_%'
      AND tc.table_name NOT LIKE '_prisma_%'
      AND tc.table_name NOT LIKE 'drizzle_%'
    ORDER BY tc.table_name, kcu.ordinal_position
  `;
}

/**
 * Get ALL foreign keys for ALL tables in one query
 */
async function getAllForeignKeys(connection: DrizzleConnection): Promise<Record<string, unknown>[]> {
  return connection.client`
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name
      AND rc.constraint_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name NOT LIKE 'pg_%'
      AND tc.table_name NOT LIKE '_prisma_%'
      AND tc.table_name NOT LIKE 'drizzle_%'
  `;
}

/**
 * Get ALL constraints for ALL tables in one query
 */
async function getAllConstraints(connection: DrizzleConnection): Promise<Record<string, unknown>[]> {
  return connection.client`
    SELECT
      tc.table_name,
      tc.constraint_name,
      tc.constraint_type,
      array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as columns,
      pg_get_constraintdef(pgc.oid) as definition
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN pg_constraint pgc
      ON pgc.conname = tc.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name NOT LIKE 'pg_%'
      AND tc.table_name NOT LIKE '_prisma_%'
      AND tc.table_name NOT LIKE 'drizzle_%'
    GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type, pgc.oid
  `;
}

/**
 * Get ALL indexes for ALL tables in one query
 */
async function getAllIndexes(connection: DrizzleConnection): Promise<Record<string, unknown>[]> {
  return connection.client`
    SELECT
      t.relname as table_name,
      i.relname as index_name,
      array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as columns,
      ix.indisunique as is_unique,
      ix.indisprimary as is_primary,
      am.amname as index_type
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_am am ON i.relam = am.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relkind = 'r'
      AND t.relname NOT LIKE 'pg_%'
      AND t.relname NOT LIKE '_prisma_%'
      AND t.relname NOT LIKE 'drizzle_%'
    GROUP BY t.relname, i.relname, ix.indisunique, ix.indisprimary, am.amname
  `;
}

/**
 * Get ALL table stats in one query (uses pg_class for speed, no COUNT(*))
 */
async function getAllTableStats(connection: DrizzleConnection): Promise<Record<string, unknown>[]> {
  return connection.client`
    SELECT 
      c.relname as table_name,
      COALESCE(c.reltuples, 0)::bigint as estimated_rows,
      pg_size_pretty(pg_total_relation_size(c.oid)) as size
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname NOT LIKE 'pg_%'
      AND c.relname NOT LIKE '_prisma_%'
      AND c.relname NOT LIKE 'drizzle_%'
  `;
}

// ============================================================================
// DATA TRANSFORMATION HELPERS - Convert raw query results to typed objects
// ============================================================================

/**
 * Group rows by table name for O(1) lookup
 */
function groupByTable(rows: Record<string, unknown>[], tableKey: string): Map<string, Record<string, unknown>[]> {
  const map = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const tableName = row[tableKey] as string;
    if (!map.has(tableName)) {
      map.set(tableName, []);
    }
    map.get(tableName)!.push(row);
  }
  return map;
}

/**
 * Build DetailedColumn array from raw rows
 */
function buildColumns(rows: Record<string, unknown>[]): DetailedColumn[] {
  return rows.map((row) => ({
    name: safeString(row.column_name),
    dataType: safeString(row.data_type),
    udtName: safeString(row.udt_name),
    isNullable: safeBoolean(row.is_nullable) || row.is_nullable === 'YES',
    defaultValue: row.column_default != null ? safeString(row.column_default) : null,
    isPrimaryKey: false,
    maxLength: safeNumberOrNull(row.character_maximum_length),
    numericPrecision: safeNumberOrNull(row.numeric_precision),
    ordinalPosition: safeNumber(row.ordinal_position, 0),
  })).filter(col => col.name); // Filter out invalid entries
}

/**
 * Build primary key object from raw rows
 */
function buildPrimaryKey(rows: Record<string, unknown>[]): { columns: string[]; constraintName: string } | null {
  if (rows.length === 0) return null;
  const constraintName = safeString(rows[0].constraint_name);
  if (!constraintName) return null;
  return {
    constraintName,
    columns: rows.map((row) => safeString(row.column_name)).filter(Boolean),
  };
}

/**
 * Build ForeignKey array from raw rows
 */
function buildForeignKeys(rows: Record<string, unknown>[]): ForeignKey[] {
  return rows.map((row) => ({
    constraintName: safeString(row.constraint_name),
    columnName: safeString(row.column_name),
    referencedTable: safeString(row.referenced_table),
    referencedColumn: safeString(row.referenced_column),
    onDelete: row.delete_rule as string,
    onUpdate: safeString(row.update_rule),
  })).filter(fk => fk.constraintName); // Filter out invalid entries
}

/**
 * Build TableConstraint array from raw rows
 */
function buildConstraints(rows: Record<string, unknown>[]): TableConstraint[] {
  return rows.map((row) => ({
    name: safeString(row.constraint_name),
    type: safeString(row.constraint_type) as TableConstraint['type'],
    columns: parsePostgresArray(row.columns) || [],
    definition: safeString(row.definition),
  })).filter(c => c.name); // Filter out invalid entries
}

/**
 * Build TableIndex array from raw rows
 */
function buildIndexes(rows: Record<string, unknown>[]): TableIndex[] {
  return rows.map((row) => ({
    name: safeString(row.index_name),
    columns: parsePostgresArray(row.columns) || [],
    isUnique: safeBoolean(row.is_unique),
    isPrimary: safeBoolean(row.is_primary),
    indexType: safeString(row.index_type),
  })).filter(idx => idx.name); // Filter out invalid entries
}

/**
 * Get all ENUM types from the database
 */
async function getEnumTypes(connection: DrizzleConnection): Promise<EnumType[]> {
  const result = await connection.client`
    SELECT 
      t.typname as enum_name,
      n.nspname as schema_name,
      array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
    GROUP BY t.typname, n.nspname
    ORDER BY t.typname
  `;
  
  return result.map((row) => ({
    name: safeString(row.enum_name),
    schema: safeString(row.schema_name),
    values: parsePostgresArray(row.enum_values),
  })).filter(e => e.name); // Filter out invalid entries
}

/**
 * Parse PostgreSQL array to JavaScript array
 * Handles both native arrays and string representations like {val1,val2}
 */
function parsePostgresArray(value: unknown): string[] {
  if (!value) {
    return [];
  }
  
  // If it's already an array, return it
  if (Array.isArray(value)) {
    return value.map(String);
  }
  
  // If it's a string (PostgreSQL array notation), parse it
  if (typeof value === 'string') {
    // Remove the curly braces and split by comma
    const trimmed = value.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const inner = trimmed.slice(1, -1);
      if (inner === '') {
        return [];
      }
      // Handle quoted values and simple values
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < inner.length; i++) {
        const char = inner[i];
        if (char === '"' && (i === 0 || inner[i - 1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.replace(/^"|"$/g, '').replace(/\\"/g, '"'));
          current = '';
        } else {
          current += char;
        }
      }
      // Don't forget the last value
      if (current) {
        values.push(current.replace(/^"|"$/g, '').replace(/\\"/g, '"'));
      }
      return values;
    }
    // Single value without braces
    return [value];
  }
  
  return [];
}

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
  return fallback;
}

/**
 * Safely coerce a value to boolean
 */
function safeBoolean(value: unknown, fallback: boolean = false): boolean {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
  }
  if (typeof value === 'number') return value !== 0;
  return fallback;
}

/**
 * Safely coerce a value to number or null
 */
function safeNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === 'bigint') {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

/**
 * Safely coerce a value to number
 */
function safeNumber(value: unknown, fallback: number = 0): number {
  const result = safeNumberOrNull(value);
  return result !== null ? result : fallback;
}

/**
 * Inspect a single table's full schema
 */
export async function inspectTable(
  connection: DrizzleConnection,
  tableName: string
): Promise<DetailedTableSchema> {
  // Get columns
  const columns = await getDetailedColumns(connection, tableName);
  
  // Get primary key
  const primaryKey = await getPrimaryKey(connection, tableName);
  
  // Mark primary key columns
  if (primaryKey) {
    for (const col of columns) {
      col.isPrimaryKey = primaryKey.columns.includes(col.name);
    }
  }
  
  // Get foreign keys
  const foreignKeys = await getForeignKeys(connection, tableName);
  
  // Get constraints
  const constraints = await getConstraints(connection, tableName);
  
  // Get indexes
  const indexes = await getIndexes(connection, tableName);
  
  // Get row count and estimated size
  const { rowCount, estimatedSize } = await getTableStats(connection, tableName);
  
  return {
    tableName,
    columns,
    primaryKey,
    foreignKeys,
    constraints,
    indexes,
    rowCount,
    estimatedSize,
  };
}

/**
 * Get detailed column information
 */
async function getDetailedColumns(
  connection: DrizzleConnection,
  tableName: string
): Promise<DetailedColumn[]> {
  const result = await connection.client`
    SELECT 
      c.column_name,
      c.data_type,
      c.udt_name,
      c.is_nullable = 'YES' as is_nullable,
      c.column_default,
      c.character_maximum_length,
      c.numeric_precision,
      c.ordinal_position
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = ${tableName}
    ORDER BY c.ordinal_position
  `;
  
  return result.map((row) => ({
    name: safeString(row.column_name),
    dataType: safeString(row.data_type),
    udtName: safeString(row.udt_name),
    isNullable: safeBoolean(row.is_nullable),
    defaultValue: row.column_default != null ? safeString(row.column_default) : null,
    isPrimaryKey: false, // Will be set later
    maxLength: safeNumberOrNull(row.character_maximum_length),
    numericPrecision: safeNumberOrNull(row.numeric_precision),
    ordinalPosition: safeNumber(row.ordinal_position, 0),
  })).filter(col => col.name); // Filter out invalid entries
}

/**
 * Get primary key information
 */
async function getPrimaryKey(
  connection: DrizzleConnection,
  tableName: string
): Promise<{ columns: string[]; constraintName: string } | null> {
  const result = await connection.client`
    SELECT 
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = ${tableName}
    ORDER BY kcu.ordinal_position
  `;
  
  if (result.length === 0) {
    return null;
  }
  
  const constraintName = safeString(result[0].constraint_name);
  if (!constraintName) return null;
  
  return {
    constraintName,
    columns: result.map((row) => safeString(row.column_name)).filter(Boolean),
  };
}

/**
 * Get foreign key information
 */
async function getForeignKeys(
  connection: DrizzleConnection,
  tableName: string
): Promise<ForeignKey[]> {
  const result = await connection.client`
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name
      AND rc.constraint_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = ${tableName}
  `;
  
  return result.map((row) => ({
    constraintName: safeString(row.constraint_name),
    columnName: safeString(row.column_name),
    referencedTable: safeString(row.referenced_table),
    referencedColumn: safeString(row.referenced_column),
    onDelete: safeString(row.delete_rule),
    onUpdate: safeString(row.update_rule),
  })).filter(fk => fk.constraintName); // Filter out invalid entries
}

/**
 * Get all constraints for a table
 */
async function getConstraints(
  connection: DrizzleConnection,
  tableName: string
): Promise<TableConstraint[]> {
  const result = await connection.client`
    SELECT
      tc.constraint_name,
      tc.constraint_type,
      array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as columns,
      pg_get_constraintdef(pgc.oid) as definition
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN pg_constraint pgc
      ON pgc.conname = tc.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = ${tableName}
    GROUP BY tc.constraint_name, tc.constraint_type, pgc.oid
  `;
  
  return result.map((row) => ({
    name: safeString(row.constraint_name),
    type: safeString(row.constraint_type) as TableConstraint['type'],
    columns: parsePostgresArray(row.columns),
    definition: safeString(row.definition),
  })).filter(c => c.name); // Filter out invalid entries
}

/**
 * Get indexes for a table
 */
async function getIndexes(
  connection: DrizzleConnection,
  tableName: string
): Promise<TableIndex[]> {
  const result = await connection.client`
    SELECT
      i.relname as index_name,
      array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as columns,
      ix.indisunique as is_unique,
      ix.indisprimary as is_primary,
      am.amname as index_type
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_am am ON i.relam = am.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = ${tableName}
    GROUP BY i.relname, ix.indisunique, ix.indisprimary, am.amname
  `;
  
  return result.map((row) => ({
    name: safeString(row.index_name),
    columns: parsePostgresArray(row.columns),
    isUnique: safeBoolean(row.is_unique),
    isPrimary: safeBoolean(row.is_primary),
    indexType: safeString(row.index_type),
  })).filter(idx => idx.name); // Filter out invalid entries
}

/**
 * Get table statistics
 */
async function getTableStats(
  connection: DrizzleConnection,
  tableName: string
): Promise<{ rowCount: number; estimatedSize: string }> {
  try {
    // Use PostgreSQL's estimated row count from pg_class (FAST - uses statistics)
    // This avoids slow COUNT(*) on large tables
    const statsResult = await connection.client`
      SELECT 
        COALESCE(c.reltuples, 0)::bigint as estimated_rows,
        pg_size_pretty(pg_total_relation_size(c.oid)) as size
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = ${tableName}
        AND n.nspname = 'public'
    `;
    
    const rowCount = parseInt(statsResult[0]?.estimated_rows as string || '0', 10);
    const estimatedSize = (statsResult[0]?.size as string) || 'Unknown';
    
    return { rowCount: Math.max(0, rowCount), estimatedSize };
  } catch {
    return { rowCount: 0, estimatedSize: 'Unknown' };
  }
}

/**
 * Quick check if a table has required sync columns
 */
export async function validateSyncRequirements(
  databaseUrl: string,
  tableName: string
): Promise<{
  isValid: boolean;
  hasIdColumn: boolean;
  hasUpdatedAt: boolean;
  idColumnType: string | null;
  updatedAtType: string | null;
  issues: string[];
}> {
  let connection: DrizzleConnection | null = null;
  
  try {
    connection = createDrizzleClient(databaseUrl);
    const columns = await getDetailedColumns(connection, tableName);
    
    const idColumn = columns.find((col) => col.name === 'id');
    const updatedAtColumn = columns.find((col) => col.name === 'updated_at');
    
    const issues: string[] = [];
    
    // Check id column
    const hasIdColumn = !!idColumn;
    const idColumnType = idColumn?.udtName || null;
    
    if (!hasIdColumn) {
      issues.push('Missing required "id" column');
    } else if (idColumnType !== 'uuid') {
      issues.push(`"id" column should be UUID type, found: ${idColumnType}`);
    }
    
    // Check updated_at column
    const hasUpdatedAt = !!updatedAtColumn;
    const updatedAtType = updatedAtColumn?.udtName || null;
    
    if (!hasUpdatedAt) {
      issues.push('Missing required "updated_at" column');
    } else if (!['timestamptz', 'timestamp'].includes(updatedAtType || '')) {
      issues.push(`"updated_at" column should be TIMESTAMP type, found: ${updatedAtType}`);
    }
    
    // Check if updated_at is nullable
    if (updatedAtColumn?.isNullable) {
      issues.push('"updated_at" column should be NOT NULL');
    }
    
    return {
      isValid: issues.length === 0,
      hasIdColumn,
      hasUpdatedAt,
      idColumnType,
      updatedAtType,
      issues,
    };
    
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

/**
 * Compare two columns for type compatibility
 */
export function areTypesCompatible(sourceType: string, targetType: string): boolean {
  // Exact match
  if (sourceType === targetType) {
    return true;
  }
  
  // Normalize types
  const normalize = (t: string) => t.toLowerCase().replace(/\s+/g, '');
  const src = normalize(sourceType);
  const tgt = normalize(targetType);
  
  // Compatible type groups
  const compatibleGroups = [
    ['int2', 'int4', 'int8', 'smallint', 'integer', 'bigint'],
    ['float4', 'float8', 'real', 'doubleprecision', 'numeric', 'decimal'],
    ['varchar', 'charactervarying', 'text', 'char', 'character'],
    ['timestamp', 'timestamptz', 'timestampwithtimezone', 'timestampwithouttimezone'],
    ['bool', 'boolean'],
    ['json', 'jsonb'],
  ];
  
  for (const group of compatibleGroups) {
    const srcInGroup = group.some((t) => src.includes(t));
    const tgtInGroup = group.some((t) => tgt.includes(t));
    if (srcInGroup && tgtInGroup) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if source type can safely be inserted into target type
 */
export function canSafelyInsert(
  sourceColumn: DetailedColumn,
  targetColumn: DetailedColumn
): { safe: boolean; warning: string | null } {
  // Check type compatibility first
  if (!areTypesCompatible(sourceColumn.udtName, targetColumn.udtName)) {
    return {
      safe: false,
      warning: `Type mismatch: ${sourceColumn.udtName} → ${targetColumn.udtName}`,
    };
  }
  
  // Check string length constraints
  if (sourceColumn.maxLength && targetColumn.maxLength) {
    if (sourceColumn.maxLength > targetColumn.maxLength) {
      return {
        safe: false,
        warning: `Source max length (${sourceColumn.maxLength}) exceeds target (${targetColumn.maxLength})`,
      };
    }
  }
  
  // Check numeric precision
  if (sourceColumn.numericPrecision && targetColumn.numericPrecision) {
    if (sourceColumn.numericPrecision > targetColumn.numericPrecision) {
      return {
        safe: false,
        warning: `Source precision (${sourceColumn.numericPrecision}) exceeds target (${targetColumn.numericPrecision})`,
      };
    }
  }
  
  // Check nullability - source can be NULL but target is NOT NULL
  if (sourceColumn.isNullable && !targetColumn.isNullable && !targetColumn.defaultValue) {
    return {
      safe: false,
      warning: `Source column is nullable but target is NOT NULL without default`,
    };
  }
  
  return { safe: true, warning: null };
}


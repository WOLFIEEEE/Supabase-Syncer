/**
 * Schema Inspector Service
 * 
 * Provides comprehensive schema inspection for PostgreSQL databases.
 * Extracts columns, primary keys, foreign keys, constraints, and indexes.
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

/**
 * Inspect the full schema of a database
 */
export async function inspectDatabaseSchema(databaseUrl: string): Promise<DatabaseSchema> {
  let connection: DrizzleConnection | null = null;
  
  try {
    connection = createDrizzleClient(databaseUrl);
    
    // Get PostgreSQL version
    const versionResult = await connection.client`SELECT version()`;
    const version = (versionResult[0]?.version as string) || 'Unknown';
    
    // Get all ENUM types first
    const enums = await getEnumTypes(connection);
    
    // Get all public tables
    const tablesResult = await connection.client`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'pg_%'
        AND table_name NOT LIKE '_prisma_%'
        AND table_name NOT LIKE 'drizzle_%'
      ORDER BY table_name
    `;
    
    const tableNames = tablesResult.map((row) => row.table_name as string);
    
    // Inspect each table in detail
    const tables: DetailedTableSchema[] = [];
    const syncableTables: string[] = [];
    
    for (const tableName of tableNames) {
      const tableSchema = await inspectTable(connection, tableName);
      tables.push(tableSchema);
      
      // Check if table is syncable (has id UUID and updated_at timestamp)
      const hasIdColumn = tableSchema.columns.some(
        (col) => col.name === 'id' && (col.udtName === 'uuid' || col.dataType === 'uuid')
      );
      const hasUpdatedAt = tableSchema.columns.some(
        (col) => col.name === 'updated_at' && 
          (col.udtName === 'timestamptz' || col.udtName === 'timestamp' || 
           col.dataType.includes('timestamp'))
      );
      
      if (hasIdColumn && hasUpdatedAt) {
        syncableTables.push(tableName);
      }
    }
    
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
    name: row.enum_name as string,
    schema: row.schema_name as string,
    values: (row.enum_values as string[]) || [],
  }));
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
    name: row.column_name as string,
    dataType: row.data_type as string,
    udtName: row.udt_name as string,
    isNullable: row.is_nullable as boolean,
    defaultValue: row.column_default as string | null,
    isPrimaryKey: false, // Will be set later
    maxLength: row.character_maximum_length as number | null,
    numericPrecision: row.numeric_precision as number | null,
    ordinalPosition: row.ordinal_position as number,
  }));
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
  
  return {
    constraintName: result[0].constraint_name as string,
    columns: result.map((row) => row.column_name as string),
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
    constraintName: row.constraint_name as string,
    columnName: row.column_name as string,
    referencedTable: row.referenced_table as string,
    referencedColumn: row.referenced_column as string,
    onDelete: row.delete_rule as string,
    onUpdate: row.update_rule as string,
  }));
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
    name: row.constraint_name as string,
    type: row.constraint_type as TableConstraint['type'],
    columns: (row.columns as string[]) || [],
    definition: (row.definition as string) || '',
  }));
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
    name: row.index_name as string,
    columns: (row.columns as string[]) || [],
    isUnique: row.is_unique as boolean,
    isPrimary: row.is_primary as boolean,
    indexType: row.index_type as string,
  }));
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


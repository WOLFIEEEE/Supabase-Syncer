/**
 * Schema Migration Generator
 * 
 * Generates safe, idempotent SQL DDL statements to fix schema differences.
 * All queries use IF EXISTS / IF NOT EXISTS for safety.
 */

import type {
  DetailedColumn,
  DetailedTableSchema,
  ValidationIssue,
  SchemaValidationResult,
  TableComparisonResult,
} from '@/types';

export interface MigrationScript {
  tableName: string;
  description: string;
  sql: string;
  isDestructive: boolean;
  severity: 'safe' | 'caution' | 'dangerous';
}

export interface MigrationPlan {
  scripts: MigrationScript[];
  summary: {
    totalScripts: number;
    safeScripts: number;
    cautionScripts: number;
    dangerousScripts: number;
  };
  fullScript: string;
  rollbackScript: string;
}

/**
 * Generate migration scripts from validation results
 */
export function generateMigrationPlan(
  validationResult: SchemaValidationResult,
  direction: 'source_to_target' | 'target_to_source' = 'source_to_target'
): MigrationPlan {
  const scripts: MigrationScript[] = [];
  
  // Process each table comparison
  for (const comparison of validationResult.comparisonDetails) {
    const sourceTable = validationResult.sourceSchema.tables.find(
      (t) => t.tableName === comparison.tableName
    );
    const targetTable = validationResult.targetSchema.tables.find(
      (t) => t.tableName === comparison.tableName
    );
    
    if (direction === 'source_to_target') {
      // Generate scripts to make target match source
      scripts.push(...generateTableMigrationScripts(
        comparison.tableName,
        sourceTable,
        targetTable,
        comparison
      ));
    } else {
      // Generate scripts to make source match target
      scripts.push(...generateTableMigrationScripts(
        comparison.tableName,
        targetTable,
        sourceTable,
        comparison
      ));
    }
  }
  
  // Calculate summary
  const summary = {
    totalScripts: scripts.length,
    safeScripts: scripts.filter((s) => s.severity === 'safe').length,
    cautionScripts: scripts.filter((s) => s.severity === 'caution').length,
    dangerousScripts: scripts.filter((s) => s.severity === 'dangerous').length,
  };
  
  // Generate full script with transaction
  const fullScript = generateFullScript(scripts);
  const rollbackScript = generateRollbackScript(scripts, validationResult);
  
  return {
    scripts,
    summary,
    fullScript,
    rollbackScript,
  };
}

/**
 * Generate migration scripts for a single table
 */
function generateTableMigrationScripts(
  tableName: string,
  referenceTable: DetailedTableSchema | undefined,
  targetTable: DetailedTableSchema | undefined,
  comparison: TableComparisonResult
): MigrationScript[] {
  const scripts: MigrationScript[] = [];
  
  // Handle missing table
  if (!targetTable && referenceTable) {
    scripts.push(generateCreateTableScript(referenceTable));
    return scripts;
  }
  
  if (!referenceTable || !targetTable) {
    return scripts;
  }
  
  // Build column maps
  const refColMap = new Map(referenceTable.columns.map((c) => [c.name, c]));
  const targetColMap = new Map(targetTable.columns.map((c) => [c.name, c]));
  
  // Find columns to add (in reference but not in target)
  for (const [colName, refCol] of refColMap) {
    if (!targetColMap.has(colName)) {
      scripts.push(generateAddColumnScript(tableName, refCol));
    }
  }
  
  // Find columns with type mismatches
  const colComparisons = comparison.columnComparisons || comparison.columnComparison || [];
  for (const colComparison of colComparisons) {
    if (colComparison.sourceColumn && colComparison.targetColumn && !colComparison.isCompatible) {
      scripts.push(generateAlterColumnScript(
        tableName,
        colComparison.sourceColumn,
        colComparison.targetColumn
      ));
    }
  }
  
  // Add missing indexes
  for (const refIndex of referenceTable.indexes) {
    const hasMatchingIndex = targetTable.indexes.some(
      (ti) => JSON.stringify(ti.columns.sort()) === JSON.stringify(refIndex.columns.sort())
    );
    if (!hasMatchingIndex && !refIndex.isPrimary) {
      scripts.push(generateCreateIndexScript(tableName, refIndex));
    }
  }
  
  // Add missing constraints
  for (const refConstraint of referenceTable.constraints) {
    if (refConstraint.type === 'CHECK') {
      const hasMatchingConstraint = targetTable.constraints.some(
        (tc) => tc.type === 'CHECK' && tc.definition === refConstraint.definition
      );
      if (!hasMatchingConstraint) {
        scripts.push(generateAddConstraintScript(tableName, refConstraint));
      }
    }
  }
  
  return scripts;
}

/**
 * Generate CREATE TABLE script
 */
function generateCreateTableScript(table: DetailedTableSchema): MigrationScript {
  const columns = table.columns.map((col) => {
    let colDef = `    "${col.name}" ${getFullDataType(col)}`;
    if (!col.isNullable) colDef += ' NOT NULL';
    if (col.defaultValue) colDef += ` DEFAULT ${col.defaultValue}`;
    return colDef;
  }).join(',\n');
  
  // Primary key constraint
  let pkConstraint = '';
  if (table.primaryKey) {
    const pkCols = table.primaryKey.columns.map((c) => `"${c}"`).join(', ');
    pkConstraint = `,\n    CONSTRAINT "${table.primaryKey.constraintName}" PRIMARY KEY (${pkCols})`;
  }
  
  const sql = `-- Create table: ${table.tableName}
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${table.tableName}'
    ) THEN
        CREATE TABLE public."${table.tableName}" (
${columns}${pkConstraint}
        );
        RAISE NOTICE 'Created table: ${table.tableName}';
    ELSE
        RAISE NOTICE 'Table already exists: ${table.tableName}';
    END IF;
END $$;
`;

  return {
    tableName: table.tableName,
    description: `Create table "${table.tableName}" with ${table.columns.length} columns`,
    sql,
    isDestructive: false,
    severity: 'safe',
  };
}

/**
 * Generate ADD COLUMN script
 */
function generateAddColumnScript(tableName: string, column: DetailedColumn): MigrationScript {
  const dataType = getFullDataType(column);
  const nullability = column.isNullable ? '' : ' NOT NULL';
  const defaultValue = column.defaultValue ? ` DEFAULT ${column.defaultValue}` : '';
  
  // For NOT NULL columns without defaults, we need a different approach
  let sql: string;
  
  if (!column.isNullable && !column.defaultValue) {
    // Add as nullable first, then set default, then make NOT NULL
    sql = `-- Add column: ${tableName}.${column.name} (NOT NULL without default - multi-step)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}' 
        AND column_name = '${column.name}'
    ) THEN
        -- Step 1: Add column as nullable
        ALTER TABLE public."${tableName}" 
        ADD COLUMN "${column.name}" ${dataType};
        
        -- Step 2: Set a default value for existing rows
        -- WARNING: You may need to customize this default value!
        UPDATE public."${tableName}" 
        SET "${column.name}" = ${getDefaultForType(column.udtName)}
        WHERE "${column.name}" IS NULL;
        
        -- Step 3: Make column NOT NULL
        ALTER TABLE public."${tableName}" 
        ALTER COLUMN "${column.name}" SET NOT NULL;
        
        RAISE NOTICE 'Added NOT NULL column: ${tableName}.${column.name}';
    ELSE
        RAISE NOTICE 'Column already exists: ${tableName}.${column.name}';
    END IF;
END $$;
`;
  } else {
    sql = `-- Add column: ${tableName}.${column.name}
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}' 
        AND column_name = '${column.name}'
    ) THEN
        ALTER TABLE public."${tableName}" 
        ADD COLUMN "${column.name}" ${dataType}${nullability}${defaultValue};
        RAISE NOTICE 'Added column: ${tableName}.${column.name}';
    ELSE
        RAISE NOTICE 'Column already exists: ${tableName}.${column.name}';
    END IF;
END $$;
`;
  }

  return {
    tableName,
    description: `Add column "${column.name}" (${dataType}) to "${tableName}"`,
    sql,
    isDestructive: false,
    severity: !column.isNullable && !column.defaultValue ? 'caution' : 'safe',
  };
}

/**
 * Generate ALTER COLUMN script for type changes
 */
function generateAlterColumnScript(
  tableName: string,
  sourceColumn: DetailedColumn,
  targetColumn: DetailedColumn
): MigrationScript {
  const sourceType = getFullDataType(sourceColumn);
  const targetType = getFullDataType(targetColumn);
  
  const sql = `-- Alter column type: ${tableName}.${sourceColumn.name} (${targetType} -> ${sourceType})
-- WARNING: This may cause data loss if types are incompatible!
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}' 
        AND column_name = '${sourceColumn.name}'
    ) THEN
        -- Attempt type conversion with USING clause
        BEGIN
            ALTER TABLE public."${tableName}" 
            ALTER COLUMN "${sourceColumn.name}" TYPE ${sourceType}
            USING "${sourceColumn.name}"::${sourceType};
            RAISE NOTICE 'Altered column type: ${tableName}.${sourceColumn.name} to ${sourceType}';
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not alter column ${tableName}.${sourceColumn.name}: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Column does not exist: ${tableName}.${sourceColumn.name}';
    END IF;
END $$;
`;

  return {
    tableName,
    description: `Change "${tableName}.${sourceColumn.name}" from ${targetType} to ${sourceType}`,
    sql,
    isDestructive: true,
    severity: 'dangerous',
  };
}

/**
 * Generate CREATE INDEX script
 */
function generateCreateIndexScript(
  tableName: string,
  index: { name: string; columns: string[]; isUnique: boolean; indexType: string }
): MigrationScript {
  const uniqueKeyword = index.isUnique ? 'UNIQUE ' : '';
  const columns = index.columns.map((c) => `"${c}"`).join(', ');
  const indexName = `idx_${tableName}_${index.columns.join('_')}`;
  
  const sql = `-- Create index: ${indexName}
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = '${tableName}' 
        AND indexname = '${indexName}'
    ) THEN
        CREATE ${uniqueKeyword}INDEX "${indexName}" 
        ON public."${tableName}" (${columns});
        RAISE NOTICE 'Created index: ${indexName}';
    ELSE
        RAISE NOTICE 'Index already exists: ${indexName}';
    END IF;
END $$;
`;

  return {
    tableName,
    description: `Create ${index.isUnique ? 'unique ' : ''}index on "${tableName}" (${columns})`,
    sql,
    isDestructive: false,
    severity: 'safe',
  };
}

/**
 * Generate ADD CONSTRAINT script
 */
function generateAddConstraintScript(
  tableName: string,
  constraint: { name: string; type: string; definition: string }
): MigrationScript {
  const sql = `-- Add constraint: ${constraint.name}
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}' 
        AND constraint_name = '${constraint.name}'
    ) THEN
        ALTER TABLE public."${tableName}" 
        ADD CONSTRAINT "${constraint.name}" ${constraint.definition};
        RAISE NOTICE 'Added constraint: ${constraint.name}';
    ELSE
        RAISE NOTICE 'Constraint already exists: ${constraint.name}';
    END IF;
END $$;
`;

  return {
    tableName,
    description: `Add ${constraint.type} constraint "${constraint.name}" to "${tableName}"`,
    sql,
    isDestructive: false,
    severity: 'safe',
  };
}

/**
 * Generate full migration script with transaction wrapper
 */
function generateFullScript(scripts: MigrationScript[]): string {
  if (scripts.length === 0) {
    return '-- No migration scripts needed\n';
  }
  
  const header = `-- =============================================================================
-- SCHEMA MIGRATION SCRIPT
-- Generated: ${new Date().toISOString()}
-- =============================================================================
-- 
-- This script will modify your database schema to match the source database.
-- 
-- WARNINGS:
-- - Always backup your database before running migrations
-- - Review each statement carefully before execution
-- - Test in a non-production environment first
-- - Some operations marked as DANGEROUS may cause data loss
--
-- =============================================================================

-- Start transaction (recommended for safety)
BEGIN;

-- Set search path
SET search_path TO public;

`;

  const body = scripts.map((script) => script.sql).join('\n');
  
  const footer = `
-- =============================================================================
-- COMMIT or ROLLBACK
-- =============================================================================
-- If everything looks good, run: COMMIT;
-- If something went wrong, run: ROLLBACK;
-- =============================================================================

-- Uncomment the line below to commit changes:
-- COMMIT;

-- Or rollback if needed:
-- ROLLBACK;
`;

  return header + body + footer;
}

/**
 * Generate rollback script
 */
function generateRollbackScript(
  scripts: MigrationScript[],
  validationResult: SchemaValidationResult
): string {
  const rollbackStatements: string[] = [];
  
  for (const script of scripts) {
    // Generate inverse operations where possible
    if (script.description.startsWith('Add column')) {
      const match = script.description.match(/Add column "(.+)" .+ to "(.+)"/);
      if (match) {
        rollbackStatements.push(`-- Rollback: ${script.description}
ALTER TABLE public."${match[2]}" DROP COLUMN IF EXISTS "${match[1]}";
`);
      }
    } else if (script.description.startsWith('Create table')) {
      const match = script.description.match(/Create table "(.+)"/);
      if (match) {
        rollbackStatements.push(`-- Rollback: ${script.description}
DROP TABLE IF EXISTS public."${match[1]}" CASCADE;
`);
      }
    } else if (script.description.startsWith('Create')) {
      const match = script.description.match(/Create .+index on "(.+)"/);
      if (match) {
        const indexName = script.sql.match(/CREATE .+INDEX "(.+?)"/)?.[1];
        if (indexName) {
          rollbackStatements.push(`-- Rollback: ${script.description}
DROP INDEX IF EXISTS public."${indexName}";
`);
        }
      }
    }
  }
  
  if (rollbackStatements.length === 0) {
    return '-- No rollback scripts available\n-- Manual rollback may be required for type changes\n';
  }
  
  return `-- =============================================================================
-- ROLLBACK SCRIPT
-- Generated: ${new Date().toISOString()}
-- =============================================================================
-- WARNING: This will undo the migration changes
-- Some changes (like type alterations) cannot be automatically rolled back
-- =============================================================================

BEGIN;

${rollbackStatements.join('\n')}

COMMIT;
`;
}

/**
 * Get full data type string including length/precision
 */
function getFullDataType(column: DetailedColumn): string {
  let type = column.udtName;
  
  // Handle array types
  if (type.startsWith('_')) {
    type = type.substring(1) + '[]';
  }
  
  // Add length for varchar/char types
  if ((type === 'varchar' || type === 'bpchar') && column.maxLength) {
    type = `varchar(${column.maxLength})`;
  }
  
  // Add precision for numeric types
  if (type === 'numeric' && column.numericPrecision) {
    type = `numeric(${column.numericPrecision})`;
  }
  
  // Map common types to their SQL names
  const typeMap: Record<string, string> = {
    'int4': 'INTEGER',
    'int8': 'BIGINT',
    'int2': 'SMALLINT',
    'float4': 'REAL',
    'float8': 'DOUBLE PRECISION',
    'bool': 'BOOLEAN',
    'timestamptz': 'TIMESTAMPTZ',
    'timestamp': 'TIMESTAMP',
    'bpchar': 'CHAR',
  };
  
  return typeMap[type] || type.toUpperCase();
}

/**
 * Get a sensible default value for a data type
 */
function getDefaultForType(udtName: string): string {
  switch (udtName) {
    case 'uuid':
      return "gen_random_uuid()";
    case 'int2':
    case 'int4':
    case 'int8':
    case 'numeric':
    case 'float4':
    case 'float8':
      return '0';
    case 'bool':
      return 'false';
    case 'text':
    case 'varchar':
    case 'bpchar':
      return "''";
    case 'timestamp':
    case 'timestamptz':
      return 'NOW()';
    case 'date':
      return 'CURRENT_DATE';
    case 'json':
    case 'jsonb':
      return "'{}'::jsonb";
    default:
      return 'NULL';
  }
}

/**
 * Generate a quick fix SQL for a specific validation issue
 */
export function generateQuickFixSQL(
  issue: ValidationIssue,
  sourceSchema: DetailedTableSchema | undefined,
  targetSchema: DetailedTableSchema | undefined
): string | null {
  if (!sourceSchema) return null;
  
  switch (issue.category) {
    case 'Table Structure':
      if (issue.message.includes('does not exist in target')) {
        const script = generateCreateTableScript(sourceSchema);
        return script.sql;
      }
      break;
      
    case 'Column Mismatch':
    case 'Required Columns':
      if (issue.columnName) {
        const column = sourceSchema.columns.find((c) => c.name === issue.columnName);
        if (column && issue.message.includes('missing')) {
          const script = generateAddColumnScript(sourceSchema.tableName, column);
          return script.sql;
        }
      }
      break;
      
    case 'Type Mismatch':
      if (issue.columnName) {
        const sourceCol = sourceSchema.columns.find((c) => c.name === issue.columnName);
        const targetCol = targetSchema?.columns.find((c) => c.name === issue.columnName);
        if (sourceCol && targetCol) {
          const script = generateAlterColumnScript(sourceSchema.tableName, sourceCol, targetCol);
          return script.sql;
        }
      }
      break;
  }
  
  return null;
}


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
  EnumType,
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
 * Safely get columns as an array (handles PostgreSQL string format {col1,col2})
 */
function getColumns(columns: unknown): string[] {
  if (!columns) return [];
  if (Array.isArray(columns)) return columns.map(String);
  if (typeof columns === 'string') {
    const trimmed = columns.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const inner = trimmed.slice(1, -1);
      if (inner === '') return [];
      return inner.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    }
    return [columns];
  }
  return [];
}

/**
 * Safely compare two column arrays (sorted)
 */
function columnsMatch(cols1: unknown, cols2: unknown): boolean {
  const arr1 = getColumns(cols1).sort();
  const arr2 = getColumns(cols2).sort();
  return JSON.stringify(arr1) === JSON.stringify(arr2);
}

/**
 * Generate migration scripts from validation results
 */
export function generateMigrationPlan(
  validationResult: SchemaValidationResult,
  direction: 'source_to_target' | 'target_to_source' = 'source_to_target'
): MigrationPlan {
  const scripts: MigrationScript[] = [];
  
  // Get source and target enums (with fallback for backward compatibility)
  const sourceEnums = validationResult.sourceSchema.enums || [];
  const targetEnums = validationResult.targetSchema.enums || [];
  
  // Process ENUM differences first (ENUMs must be created before tables that use them)
  if (direction === 'source_to_target') {
    scripts.push(...generateEnumMigrationScripts(sourceEnums, targetEnums));
  } else {
    scripts.push(...generateEnumMigrationScripts(targetEnums, sourceEnums));
  }
  
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
  
  // Handle table missing in target (need to CREATE)
  if (!targetTable && referenceTable) {
    scripts.push(generateCreateTableScript(referenceTable));
    return scripts;
  }
  
  // Handle table missing in source/reference but exists in target (need to DROP or skip)
  if (!referenceTable && targetTable) {
    // Generate DROP TABLE script - this is DANGEROUS
    scripts.push(generateDropTableScript(targetTable));
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
      (ti) => columnsMatch(ti.columns, refIndex.columns)
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
 * Generate DROP TABLE script
 * WARNING: This is a DANGEROUS operation that will delete all data!
 */
function generateDropTableScript(table: DetailedTableSchema): MigrationScript {
  const sql = `-- DROP table: ${table.tableName}
-- ⚠️  WARNING: This will DELETE ALL DATA in this table!
-- ⚠️  This table exists in target but NOT in source.
-- ⚠️  If you want to KEEP this table, swap your source and target databases.
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${table.tableName}'
    ) THEN
        -- Uncomment the line below to actually drop the table:
        -- DROP TABLE public."${table.tableName}" CASCADE;
        RAISE NOTICE 'Table "${table.tableName}" exists in target but not source. Skipping drop for safety.';
        RAISE NOTICE 'To drop this table, uncomment the DROP TABLE line above.';
    END IF;
END $$;
`;

  return {
    tableName: table.tableName,
    description: `DROP table "${table.tableName}" (exists in target but not source) - COMMENTED OUT FOR SAFETY`,
    sql,
    isDestructive: true,
    severity: 'dangerous',
  };
}

/**
 * Generate migration scripts for ENUM type differences
 */
function generateEnumMigrationScripts(
  sourceEnums: EnumType[],
  targetEnums: EnumType[]
): MigrationScript[] {
  const scripts: MigrationScript[] = [];
  
  const sourceEnumMap = new Map(sourceEnums.map((e) => [e.name, e]));
  const targetEnumMap = new Map(targetEnums.map((e) => [e.name, e]));
  
  // Find ENUMs that exist in source but not in target (need to CREATE)
  for (const [enumName, sourceEnum] of sourceEnumMap) {
    const targetEnum = targetEnumMap.get(enumName);
    const sourceValues = getEnumValues(sourceEnum);
    
    if (!targetEnum) {
      // ENUM doesn't exist in target - create it
      scripts.push(generateCreateEnumScript(sourceEnum));
    } else {
      // ENUM exists in both - check for value differences
      const targetValues = new Set(getEnumValues(targetEnum));
      
      // Find values in source but not in target (need to ADD)
      for (const value of sourceValues) {
        if (!targetValues.has(value)) {
          scripts.push(generateAddEnumValueScript(enumName, value, sourceValues));
        }
      }
    }
  }
  
  // Find ENUMs that exist in target but not in source (may need to DROP)
  for (const [enumName, targetEnum] of targetEnumMap) {
    if (!sourceEnumMap.has(enumName)) {
      scripts.push(generateDropEnumScript(targetEnum));
    }
  }
  
  return scripts;
}

/**
 * Safely get values array from enum type
 */
function getEnumValues(enumType: EnumType): string[] {
  return Array.isArray(enumType.values) ? enumType.values : [];
}

/**
 * Generate CREATE TYPE script for ENUM
 */
function generateCreateEnumScript(enumType: EnumType): MigrationScript {
  const enumValues = getEnumValues(enumType);
  const values = enumValues.map((v) => `'${v.replace(/'/g, "''")}'`).join(', ');
  
  const sql = `-- Create ENUM type: ${enumType.name}
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE t.typname = '${enumType.name}'
        AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public."${enumType.name}" AS ENUM (${values});
        RAISE NOTICE 'Created ENUM type: ${enumType.name}';
    ELSE
        RAISE NOTICE 'ENUM type already exists: ${enumType.name}';
    END IF;
END $$;
`;

  return {
    tableName: `ENUM:${enumType.name}`,
    description: `Create ENUM type "${enumType.name}" with values: ${enumValues.join(', ')}`,
    sql,
    isDestructive: false,
    severity: 'safe',
  };
}

/**
 * Generate ALTER TYPE script to add a new ENUM value
 */
function generateAddEnumValueScript(
  enumName: string,
  newValue: string,
  allValues: string[]
): MigrationScript {
  // Find the position to insert the new value (after the previous value in source order)
  const valueIndex = allValues.indexOf(newValue);
  const afterValue = valueIndex > 0 ? allValues[valueIndex - 1] : null;
  
  const afterClause = afterValue 
    ? ` AFTER '${afterValue.replace(/'/g, "''")}'` 
    : '';
  
  const sql = `-- Add value to ENUM type: ${enumName}
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE t.typname = '${enumName}'
        AND n.nspname = 'public'
        AND e.enumlabel = '${newValue.replace(/'/g, "''")}'
    ) THEN
        ALTER TYPE public."${enumName}" ADD VALUE '${newValue.replace(/'/g, "''")}'${afterClause};
        RAISE NOTICE 'Added value "${newValue}" to ENUM: ${enumName}';
    ELSE
        RAISE NOTICE 'ENUM value already exists: ${enumName}.${newValue}';
    END IF;
END $$;
`;

  return {
    tableName: `ENUM:${enumName}`,
    description: `Add value "${newValue}" to ENUM type "${enumName}"`,
    sql,
    isDestructive: false,
    severity: 'safe',
  };
}

/**
 * Generate DROP TYPE script for ENUM
 * WARNING: This will fail if any tables still use this type!
 */
function generateDropEnumScript(enumType: EnumType): MigrationScript {
  const sql = `-- DROP ENUM type: ${enumType.name}
-- ⚠️  WARNING: This ENUM exists in target but NOT in source.
-- ⚠️  This will FAIL if any tables still use this type!
-- ⚠️  If you want to KEEP this ENUM, swap your source and target databases.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE t.typname = '${enumType.name}'
        AND n.nspname = 'public'
    ) THEN
        -- Check if ENUM is still in use
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE udt_name = '${enumType.name}'
            AND table_schema = 'public'
        ) THEN
            RAISE NOTICE 'ENUM "${enumType.name}" is still in use by tables. Skipping drop.';
        ELSE
            -- Uncomment the line below to actually drop the ENUM:
            -- DROP TYPE public."${enumType.name}";
            RAISE NOTICE 'ENUM "${enumType.name}" exists in target but not source. Skipping drop for safety.';
        END IF;
    END IF;
END $$;
`;

  return {
    tableName: `ENUM:${enumType.name}`,
    description: `DROP ENUM type "${enumType.name}" (exists in target but not source) - COMMENTED OUT FOR SAFETY`,
    sql,
    isDestructive: true,
    severity: 'dangerous',
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
  index: { name: string; columns: string[] | unknown; isUnique: boolean; indexType: string }
): MigrationScript {
  const uniqueKeyword = index.isUnique ? 'UNIQUE ' : '';
  const colsArray = getColumns(index.columns);
  const columns = colsArray.map((c) => `"${c}"`).join(', ');
  const indexName = `idx_${tableName}_${colsArray.join('_')}`;
  
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
-- Total statements: ${scripts.length}
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
-- NOTE: Each statement is executed individually with automatic error handling.
-- =============================================================================

`;

  const body = scripts.map((script) => script.sql).join('\n');
  
  const footer = `
-- =============================================================================
-- END OF MIGRATION SCRIPT
-- =============================================================================
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
  
  // Process scripts in reverse order for proper rollback sequence
  // (e.g., drop tables before dropping ENUMs they depend on)
  const reversedScripts = [...scripts].reverse();
  
  for (const script of reversedScripts) {
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
    } else if (script.description.startsWith('Create ENUM type')) {
      const match = script.description.match(/Create ENUM type "(.+)"/);
      if (match) {
        rollbackStatements.push(`-- Rollback: ${script.description}
DROP TYPE IF EXISTS public."${match[1]}";
`);
      }
    } else if (script.description.startsWith('Add value')) {
      // ENUM values cannot be easily removed in PostgreSQL
      // You would need to recreate the type
      const match = script.description.match(/Add value "(.+)" to ENUM type "(.+)"/);
      if (match) {
        rollbackStatements.push(`-- Rollback: ${script.description}
-- WARNING: PostgreSQL does not support removing ENUM values directly.
-- To remove value "${match[1]}" from ENUM "${match[2]}", you would need to:
-- 1. Create a new ENUM type without the value
-- 2. Update all columns to use the new type
-- 3. Drop the old type
-- 4. Rename the new type
-- This requires manual intervention.
`);
      }
    } else if (script.description.startsWith('Create') && script.description.includes('index')) {
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
-- ENUM value additions cannot be automatically rolled back in PostgreSQL
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
  
  // Check if it's a mapped type
  if (typeMap[type]) {
    return typeMap[type];
  }
  
  // Check if it's likely a user-defined type (ENUM) - don't uppercase these
  // User-defined types in PostgreSQL have dataType = 'USER-DEFINED'
  // Also, don't uppercase if it's not a known PostgreSQL type
  const knownTypes = [
    'uuid', 'text', 'varchar', 'char', 'int4', 'int8', 'int2',
    'float4', 'float8', 'numeric', 'decimal', 'bool', 'boolean',
    'timestamp', 'timestamptz', 'date', 'time', 'timetz',
    'json', 'jsonb', 'bytea', 'serial', 'bigserial', 'smallserial',
    'money', 'inet', 'cidr', 'macaddr', 'bit', 'varbit',
    'point', 'line', 'lseg', 'box', 'path', 'polygon', 'circle',
    'interval', 'xml', 'oid', 'regproc', 'regclass',
  ];
  
  const isKnownType = knownTypes.some(kt => type.toLowerCase().includes(kt));
  
  if (column.dataType === 'USER-DEFINED' || !isKnownType) {
    // It's an ENUM or custom type - keep original name with proper quoting
    return `public."${type}"`;
  }
  
  return type.toUpperCase();
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


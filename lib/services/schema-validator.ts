/**
 * Schema Validator Service
 * 
 * Validates schema compatibility between source and target databases.
 * Categorizes issues by severity and determines if sync can proceed.
 */

import { inspectDatabaseSchema, areTypesCompatible, canSafelyInsert } from './schema-inspector';
import type {
  DatabaseSchema,
  DetailedColumn,
  DetailedTableSchema,
  ValidationSeverity,
  ValidationIssue,
  SchemaValidationResult,
  TableComparisonResult,
  ColumnComparisonResult,
} from '@/types';

let issueCounter = 0;

function generateIssueId(): string {
  return `issue-${++issueCounter}`;
}

/**
 * Validate schema compatibility between source and target databases
 */
export async function validateSchemas(
  sourceUrl: string,
  targetUrl: string,
  selectedTables: string[]
): Promise<SchemaValidationResult> {
  // Reset issue counter for each validation
  issueCounter = 0;
  
  // Inspect both schemas
  const [sourceSchema, targetSchema] = await Promise.all([
    inspectDatabaseSchema(sourceUrl),
    inspectDatabaseSchema(targetUrl),
  ]);
  
  const issues: ValidationIssue[] = [];
  const comparisonDetails: TableComparisonResult[] = [];
  
  // Compare ENUM types first (tables may depend on them)
  compareEnumTypes(sourceSchema.enums || [], targetSchema.enums || [], issues);
  
  // Build lookup maps
  const sourceTableMap = new Map(sourceSchema.tables.map((t) => [t.tableName, t]));
  const targetTableMap = new Map(targetSchema.tables.map((t) => [t.tableName, t]));
  
  // Validate each selected table
  for (const tableName of selectedTables) {
    const sourceTable = sourceTableMap.get(tableName);
    const targetTable = targetTableMap.get(tableName);
    
    const comparison = compareTable(tableName, sourceTable, targetTable, issues);
    comparisonDetails.push(comparison);
  }
  
  // Calculate summary
  const summary = {
    critical: issues.filter((i) => i.severity === 'CRITICAL').length,
    high: issues.filter((i) => i.severity === 'HIGH').length,
    medium: issues.filter((i) => i.severity === 'MEDIUM').length,
    low: issues.filter((i) => i.severity === 'LOW').length,
    info: issues.filter((i) => i.severity === 'INFO').length,
  };
  
  // Determine if sync can proceed
  const canProceed = summary.critical === 0;
  const requiresConfirmation = summary.high > 0;
  const isValid = summary.critical === 0 && summary.high === 0;
  
  return {
    isValid,
    canProceed,
    requiresConfirmation,
    issues,
    summary,
    sourceSchema,
    targetSchema,
    comparisonDetails,
  };
}

/**
 * Compare ENUM types between source and target
 */
function compareEnumTypes(
  sourceEnums: { name: string; schema: string; values: string[] }[],
  targetEnums: { name: string; schema: string; values: string[] }[],
  issues: ValidationIssue[]
): void {
  const sourceEnumMap = new Map(sourceEnums.map((e) => [e.name, e]));
  const targetEnumMap = new Map(targetEnums.map((e) => [e.name, e]));
  
  // Helper to safely get values array
  const getValues = (enumObj: { values: string[] }): string[] => {
    return Array.isArray(enumObj.values) ? enumObj.values : [];
  };
  
  // Check for ENUMs in source but not in target
  for (const [enumName, sourceEnum] of sourceEnumMap) {
    const targetEnum = targetEnumMap.get(enumName);
    const sourceValues = getValues(sourceEnum);
    
    if (!targetEnum) {
      issues.push({
        id: generateIssueId(),
        severity: 'HIGH',
        category: 'ENUM Types',
        tableName: `ENUM:${enumName}`,
        message: `ENUM type "${enumName}" does not exist in target database`,
        details: `Source has ENUM "${enumName}" with values: ${sourceValues.join(', ')}. Tables using this ENUM will fail to sync.`,
        recommendation: 'The migration will create this ENUM type automatically.',
      });
    } else {
      // Check for value differences
      const targetValues = getValues(targetEnum);
      const sourceValuesSet = new Set(sourceValues);
      const targetValuesSet = new Set(targetValues);
      
      // Values in source but not in target
      const missingInTarget = sourceValues.filter((v) => !targetValuesSet.has(v));
      if (missingInTarget.length > 0) {
        issues.push({
          id: generateIssueId(),
          severity: 'MEDIUM',
          category: 'ENUM Types',
          tableName: `ENUM:${enumName}`,
          message: `ENUM "${enumName}" is missing values in target: ${missingInTarget.join(', ')}`,
          details: `Source values: [${sourceValues.join(', ')}], Target values: [${targetValues.join(', ')}]`,
          recommendation: 'The migration will add the missing values to the target ENUM.',
        });
      }
      
      // Values in target but not in source (informational - won't cause sync issues)
      const extraInTarget = targetValues.filter((v) => !sourceValuesSet.has(v));
      if (extraInTarget.length > 0) {
        issues.push({
          id: generateIssueId(),
          severity: 'INFO',
          category: 'ENUM Types',
          tableName: `ENUM:${enumName}`,
          message: `ENUM "${enumName}" has extra values in target: ${extraInTarget.join(', ')}`,
          details: `These values exist in target but not in source. This won't affect sync from source to target.`,
          recommendation: 'No action needed unless you want to keep schemas identical.',
        });
      }
    }
  }
  
  // Check for ENUMs in target but not in source
  for (const [enumName, targetEnum] of targetEnumMap) {
    if (!sourceEnumMap.has(enumName)) {
      const targetValues = getValues(targetEnum);
      issues.push({
        id: generateIssueId(),
        severity: 'INFO',
        category: 'ENUM Types',
        tableName: `ENUM:${enumName}`,
        message: `ENUM type "${enumName}" exists in target but not in source`,
        details: `Target has ENUM "${enumName}" with values: ${targetValues.join(', ')}. This won't affect sync from source to target.`,
        recommendation: 'No action needed unless you want to keep schemas identical.',
      });
    }
  }
}

/**
 * Compare a single table between source and target
 */
function compareTable(
  tableName: string,
  sourceTable: DetailedTableSchema | undefined,
  targetTable: DetailedTableSchema | undefined,
  issues: ValidationIssue[]
): TableComparisonResult {
  const result: TableComparisonResult = {
    tableName,
    existsInSource: !!sourceTable,
    existsInTarget: !!targetTable,
    isCompatible: true,
    columnComparison: [],
    foreignKeyIssues: [],
    constraintIssues: [],
    indexDifferences: [],
  };
  
  // Table missing in source
  if (!sourceTable) {
    issues.push({
      id: generateIssueId(),
      severity: 'CRITICAL',
      category: 'Table Structure',
      tableName,
      message: 'Table does not exist in source database',
      details: `The table "${tableName}" was selected for sync but does not exist in the source database.`,
      recommendation: 'Remove this table from the sync selection or verify the source database.',
    });
    result.isCompatible = false;
    return result;
  }
  
  // Table missing in target
  if (!targetTable) {
    issues.push({
      id: generateIssueId(),
      severity: 'CRITICAL',
      category: 'Table Structure',
      tableName,
      message: 'Table does not exist in target database',
      details: `The table "${tableName}" exists in source but not in target. Sync cannot create tables.`,
      recommendation: 'Create the table in the target database first, or remove from sync selection.',
    });
    result.isCompatible = false;
    return result;
  }
  
  // Validate required columns
  validateRequiredColumns(tableName, sourceTable, issues);
  validateRequiredColumns(tableName, targetTable, issues);
  
  // Compare columns
  result.columnComparison = compareColumns(tableName, sourceTable, targetTable, issues);
  
  // Check if any column comparison failed
  if (result.columnComparison.some((c) => !c.isCompatible)) {
    result.isCompatible = false;
  }
  
  // Check foreign key compatibility
  result.foreignKeyIssues = compareForeignKeys(tableName, sourceTable, targetTable, issues);
  
  // Check constraint compatibility
  result.constraintIssues = compareConstraints(tableName, sourceTable, targetTable, issues);
  
  // Check index differences (informational)
  result.indexDifferences = compareIndexes(tableName, sourceTable, targetTable, issues);
  
  return result;
}

/**
 * Validate required sync columns
 */
function validateRequiredColumns(
  tableName: string,
  table: DetailedTableSchema,
  issues: ValidationIssue[]
): void {
  const idColumn = table.columns.find((c) => c.name === 'id');
  const updatedAtColumn = table.columns.find((c) => c.name === 'updated_at');
  
  // Check id column
  if (!idColumn) {
    issues.push({
      id: generateIssueId(),
      severity: 'CRITICAL',
      category: 'Required Columns',
      tableName,
      columnName: 'id',
      message: 'Missing required "id" column',
      details: 'Sync requires an "id" column of type UUID as the primary key.',
      recommendation: 'Add an "id UUID PRIMARY KEY" column to the table.',
    });
  } else if (idColumn.udtName !== 'uuid') {
    issues.push({
      id: generateIssueId(),
      severity: 'CRITICAL',
      category: 'Required Columns',
      tableName,
      columnName: 'id',
      message: `"id" column has wrong type: ${idColumn.udtName}`,
      details: 'The "id" column must be of type UUID for sync to work correctly.',
      recommendation: 'Alter the "id" column to be UUID type.',
    });
  }
  
  // Check updated_at column
  if (!updatedAtColumn) {
    issues.push({
      id: generateIssueId(),
      severity: 'CRITICAL',
      category: 'Required Columns',
      tableName,
      columnName: 'updated_at',
      message: 'Missing required "updated_at" column',
      details: 'Sync requires an "updated_at" column of type TIMESTAMPTZ for incremental sync.',
      recommendation: 'Add an "updated_at TIMESTAMPTZ NOT NULL" column to the table.',
    });
  } else if (!['timestamptz', 'timestamp'].includes(updatedAtColumn.udtName)) {
    issues.push({
      id: generateIssueId(),
      severity: 'CRITICAL',
      category: 'Required Columns',
      tableName,
      columnName: 'updated_at',
      message: `"updated_at" column has wrong type: ${updatedAtColumn.udtName}`,
      details: 'The "updated_at" column must be of type TIMESTAMPTZ or TIMESTAMP.',
      recommendation: 'Alter the "updated_at" column to be TIMESTAMPTZ type.',
    });
  }
}

/**
 * Compare columns between source and target
 */
function compareColumns(
  tableName: string,
  sourceTable: DetailedTableSchema,
  targetTable: DetailedTableSchema,
  issues: ValidationIssue[]
): ColumnComparisonResult[] {
  const results: ColumnComparisonResult[] = [];
  
  const sourceColMap = new Map(sourceTable.columns.map((c) => [c.name, c]));
  const targetColMap = new Map(targetTable.columns.map((c) => [c.name, c]));
  
  // Check each source column
  for (const sourceCol of sourceTable.columns) {
    const targetCol = targetColMap.get(sourceCol.name);
    const colResult: ColumnComparisonResult = {
      columnName: sourceCol.name,
      sourceColumn: sourceCol,
      targetColumn: targetCol || null,
      isCompatible: true,
      issues: [],
    };
    
    if (!targetCol) {
      // Column missing in target
      if (!sourceCol.isNullable && !sourceCol.defaultValue) {
        // NOT NULL column without default - CRITICAL
        issues.push({
          id: generateIssueId(),
          severity: 'CRITICAL',
          category: 'Column Mismatch',
          tableName,
          columnName: sourceCol.name,
          message: `NOT NULL column "${sourceCol.name}" missing in target`,
          details: `Source has NOT NULL column "${sourceCol.name}" (${sourceCol.dataType}) that doesn't exist in target. Inserts will fail.`,
          recommendation: 'Add the column to the target table or make it nullable in source.',
        });
        colResult.isCompatible = false;
      } else {
        // Nullable column missing - LOW severity
        issues.push({
          id: generateIssueId(),
          severity: 'LOW',
          category: 'Column Mismatch',
          tableName,
          columnName: sourceCol.name,
          message: `Column "${sourceCol.name}" exists in source but not target`,
          details: `The column is nullable or has a default, so sync can proceed. Data in this column will not be synced.`,
          recommendation: 'Add the column to target if you need this data synced.',
        });
      }
      colResult.issues.push('Missing in target');
    } else {
      // Both have the column - check compatibility
      const compatibility = canSafelyInsert(sourceCol, targetCol);
      
      if (!compatibility.safe) {
        // Determine severity based on type of incompatibility
        const typesCompatible = areTypesCompatible(sourceCol.udtName, targetCol.udtName);
        
        if (!typesCompatible) {
          issues.push({
            id: generateIssueId(),
            severity: 'HIGH',
            category: 'Type Mismatch',
            tableName,
            columnName: sourceCol.name,
            message: `Type mismatch: ${sourceCol.udtName} → ${targetCol.udtName}`,
            details: `Column "${sourceCol.name}" has incompatible types. Source: ${sourceCol.dataType}, Target: ${targetCol.dataType}. Data may be lost or truncated.`,
            recommendation: 'Alter the target column type or exclude this column from sync.',
          });
          colResult.isCompatible = false;
        } else {
          issues.push({
            id: generateIssueId(),
            severity: 'MEDIUM',
            category: 'Type Mismatch',
            tableName,
            columnName: sourceCol.name,
            message: compatibility.warning || 'Potential compatibility issue',
            details: `Column "${sourceCol.name}" types are similar but have constraints that may cause issues.`,
            recommendation: 'Review the constraint differences and adjust if needed.',
          });
        }
        colResult.issues.push(compatibility.warning || 'Compatibility issue');
      }
    }
    
    results.push(colResult);
  }
  
  // Check for columns in target that don't exist in source (NOT NULL without default)
  for (const targetCol of targetTable.columns) {
    if (!sourceColMap.has(targetCol.name)) {
      if (!targetCol.isNullable && !targetCol.defaultValue) {
        issues.push({
          id: generateIssueId(),
          severity: 'HIGH',
          category: 'Column Mismatch',
          tableName,
          columnName: targetCol.name,
          message: `Target has NOT NULL column "${targetCol.name}" not in source`,
          details: `Target requires "${targetCol.name}" (NOT NULL, no default) but source doesn't have it. Inserts will fail.`,
          recommendation: 'Add a default value to the target column or add the column to source.',
        });
        
        results.push({
          columnName: targetCol.name,
          sourceColumn: null,
          targetColumn: targetCol,
          isCompatible: false,
          issues: ['Required in target but missing in source'],
        });
      }
    }
  }
  
  return results;
}

/**
 * Compare foreign keys
 */
function compareForeignKeys(
  tableName: string,
  sourceTable: DetailedTableSchema,
  targetTable: DetailedTableSchema,
  issues: ValidationIssue[]
): string[] {
  const fkIssues: string[] = [];
  
  // Check if target has foreign keys that might be violated
  for (const targetFk of targetTable.foreignKeys) {
    const sourceFk = sourceTable.foreignKeys.find(
      (fk) => fk.columnName === targetFk.columnName && fk.referencedTable === targetFk.referencedTable
    );
    
    if (!sourceFk) {
      issues.push({
        id: generateIssueId(),
        severity: 'HIGH',
        category: 'Foreign Keys',
        tableName,
        columnName: targetFk.columnName,
        message: `Target has FK constraint not in source: ${targetFk.constraintName}`,
        details: `Target requires "${targetFk.columnName}" to reference "${targetFk.referencedTable}.${targetFk.referencedColumn}". Sync may fail if referenced rows don't exist.`,
        recommendation: 'Ensure referenced data is synced first, or temporarily disable the FK constraint.',
      });
      fkIssues.push(`FK ${targetFk.constraintName}: ${targetFk.columnName} → ${targetFk.referencedTable}`);
    }
  }
  
  return fkIssues;
}

/**
 * Compare constraints
 */
function compareConstraints(
  tableName: string,
  sourceTable: DetailedTableSchema,
  targetTable: DetailedTableSchema,
  issues: ValidationIssue[]
): string[] {
  const constraintIssues: string[] = [];
  
  // Check UNIQUE constraints in target
  const targetUniques = targetTable.constraints.filter((c) => c.type === 'UNIQUE');
  const sourceUniques = sourceTable.constraints.filter((c) => c.type === 'UNIQUE');
  
  for (const targetUnique of targetUniques) {
    const hasMatchingSource = sourceUniques.some(
      (su) => JSON.stringify(su.columns.sort()) === JSON.stringify(targetUnique.columns.sort())
    );
    
    if (!hasMatchingSource) {
      issues.push({
        id: generateIssueId(),
        severity: 'MEDIUM',
        category: 'Constraints',
        tableName,
        message: `Target has UNIQUE constraint not in source: ${targetUnique.name}`,
        details: `Target enforces uniqueness on (${targetUnique.columns.join(', ')}) but source doesn't. Duplicate source data may cause sync failures.`,
        recommendation: 'Verify source data meets the uniqueness constraint before syncing.',
      });
      constraintIssues.push(`UNIQUE (${targetUnique.columns.join(', ')})`);
    }
  }
  
  // Check CHECK constraints in target
  const targetChecks = targetTable.constraints.filter((c) => c.type === 'CHECK');
  for (const check of targetChecks) {
    issues.push({
      id: generateIssueId(),
      severity: 'INFO',
      category: 'Constraints',
      tableName,
      message: `Target has CHECK constraint: ${check.name}`,
      details: `Check constraint: ${check.definition}. Ensure source data satisfies this constraint.`,
      recommendation: 'Verify source data meets the CHECK constraint before syncing.',
    });
    constraintIssues.push(`CHECK: ${check.name}`);
  }
  
  return constraintIssues;
}

/**
 * Compare indexes (informational only)
 */
function compareIndexes(
  tableName: string,
  sourceTable: DetailedTableSchema,
  targetTable: DetailedTableSchema,
  issues: ValidationIssue[]
): string[] {
  const indexDiffs: string[] = [];
  
  // Find indexes in target not in source
  for (const targetIdx of targetTable.indexes) {
    if (targetIdx.isPrimary) continue; // Skip primary key
    
    const hasMatchingSource = sourceTable.indexes.some(
      (si) => JSON.stringify(si.columns.sort()) === JSON.stringify(targetIdx.columns.sort())
    );
    
    if (!hasMatchingSource) {
      indexDiffs.push(`Target has index: ${targetIdx.name} on (${targetIdx.columns.join(', ')})`);
    }
  }
  
  // Find indexes in source not in target
  for (const sourceIdx of sourceTable.indexes) {
    if (sourceIdx.isPrimary) continue;
    
    const hasMatchingTarget = targetTable.indexes.some(
      (ti) => JSON.stringify(ti.columns.sort()) === JSON.stringify(sourceIdx.columns.sort())
    );
    
    if (!hasMatchingTarget) {
      indexDiffs.push(`Source has index: ${sourceIdx.name} on (${sourceIdx.columns.join(', ')})`);
    }
  }
  
  if (indexDiffs.length > 0) {
    issues.push({
      id: generateIssueId(),
      severity: 'INFO',
      category: 'Indexes',
      tableName,
      message: `${indexDiffs.length} index difference(s) detected`,
      details: indexDiffs.join('; '),
      recommendation: 'Index differences may affect performance but won\'t prevent sync.',
    });
  }
  
  return indexDiffs;
}

/**
 * Check for circular foreign key dependencies
 */
export function detectCircularDependencies(
  tables: DetailedTableSchema[]
): { hasCircular: boolean; cycles: string[][] } {
  const graph = new Map<string, string[]>();
  
  // Build dependency graph
  for (const table of tables) {
    const dependencies = table.foreignKeys.map((fk) => fk.referencedTable);
    graph.set(table.tableName, dependencies);
  }
  
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: string[][] = [];
  
  function dfs(node: string, path: string[]): boolean {
    visited.add(node);
    recursionStack.add(node);
    
    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, [...path, neighbor])) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        // Found cycle
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart >= 0) {
          cycles.push(path.slice(cycleStart));
        } else {
          cycles.push([...path, neighbor]);
        }
        return true;
      }
    }
    
    recursionStack.delete(node);
    return false;
  }
  
  for (const table of tables) {
    if (!visited.has(table.tableName)) {
      dfs(table.tableName, [table.tableName]);
    }
  }
  
  return { hasCircular: cycles.length > 0, cycles };
}

/**
 * Determine optimal sync order based on FK dependencies
 */
export function getSyncOrder(tables: DetailedTableSchema[]): string[] {
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  
  // Initialize
  for (const table of tables) {
    graph.set(table.tableName, []);
    inDegree.set(table.tableName, 0);
  }
  
  // Build graph
  for (const table of tables) {
    for (const fk of table.foreignKeys) {
      if (graph.has(fk.referencedTable)) {
        const deps = graph.get(fk.referencedTable) || [];
        deps.push(table.tableName);
        graph.set(fk.referencedTable, deps);
        inDegree.set(table.tableName, (inDegree.get(table.tableName) || 0) + 1);
      }
    }
  }
  
  // Topological sort
  const order: string[] = [];
  const queue = tables
    .map((t) => t.tableName)
    .filter((t) => inDegree.get(t) === 0);
  
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
  
  // Add any remaining tables (in cycles)
  for (const table of tables) {
    if (!order.includes(table.tableName)) {
      order.push(table.tableName);
    }
  }
  
  return order;
}

/**
 * Estimate sync data volume and duration
 */
export function estimateSyncVolume(
  sourceSchema: DatabaseSchema,
  tableNames: string[]
): {
  totalRows: number;
  totalSize: string;
  estimatedDuration: number;
  largestTable: { name: string; rows: number } | null;
  warnings: string[];
} {
  let totalRows = 0;
  let totalBytes = 0;
  let largestTable: { name: string; rows: number } | null = null;
  const warnings: string[] = [];
  
  for (const tableName of tableNames) {
    const table = sourceSchema.tables.find((t) => t.tableName === tableName);
    if (table) {
      totalRows += table.rowCount;
      
      // Parse estimated size (e.g., "10 MB", "2 GB")
      const sizeMatch = table.estimatedSize?.match(/^([\d.]+)\s*(bytes?|KB|MB|GB)?$/i);
      if (sizeMatch) {
        let bytes = parseFloat(sizeMatch[1]);
        const unit = (sizeMatch[2] || 'bytes').toLowerCase();
        if (unit === 'kb') bytes *= 1024;
        else if (unit === 'mb') bytes *= 1024 * 1024;
        else if (unit === 'gb') bytes *= 1024 * 1024 * 1024;
        totalBytes += bytes;
      }
      
      if (!largestTable || table.rowCount > largestTable.rows) {
        largestTable = { name: table.tableName, rows: table.rowCount };
      }
    }
  }
  
  // Generate warnings
  if (totalRows > 1000000) {
    warnings.push(`Very large sync: ${totalRows.toLocaleString()} total rows. Consider syncing in batches.`);
  }
  if (totalRows > 100000) {
    warnings.push(`Large dataset: ${totalRows.toLocaleString()} rows. This may take significant time.`);
  }
  if (largestTable && largestTable.rows > 500000) {
    warnings.push(`Large table: "${largestTable.name}" has ${largestTable.rows.toLocaleString()} rows.`);
  }
  
  // Estimate duration (conservative: 500 rows/sec)
  const estimatedDuration = Math.ceil(totalRows / 500);
  
  // Format total size
  let totalSize: string;
  if (totalBytes >= 1024 * 1024 * 1024) {
    totalSize = `${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  } else if (totalBytes >= 1024 * 1024) {
    totalSize = `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
  } else if (totalBytes >= 1024) {
    totalSize = `${(totalBytes / 1024).toFixed(2)} KB`;
  } else {
    totalSize = `${totalBytes} bytes`;
  }
  
  return {
    totalRows,
    totalSize,
    estimatedDuration,
    largestTable,
    warnings,
  };
}

/**
 * Get a human-readable summary of validation results
 */
export function getValidationSummary(result: SchemaValidationResult): string {
  const lines: string[] = [];
  
  if (result.summary.critical > 0) {
    lines.push(`❌ ${result.summary.critical} CRITICAL issue(s) - Sync BLOCKED`);
  }
  if (result.summary.high > 0) {
    lines.push(`⚠️ ${result.summary.high} HIGH risk issue(s) - Requires confirmation`);
  }
  if (result.summary.medium > 0) {
    lines.push(`⚡ ${result.summary.medium} MEDIUM issue(s) - Review recommended`);
  }
  if (result.summary.low > 0) {
    lines.push(`ℹ️ ${result.summary.low} LOW issue(s) - Informational`);
  }
  if (result.summary.info > 0) {
    lines.push(`📝 ${result.summary.info} INFO notice(s)`);
  }
  
  if (lines.length === 0) {
    lines.push('✅ All validations passed');
  }
  
  return lines.join('\n');
}

/**
 * Filter issues by severity
 */
export function filterIssuesBySeverity(
  issues: ValidationIssue[],
  severities: ValidationSeverity[]
): ValidationIssue[] {
  return issues.filter((issue) => severities.includes(issue.severity));
}

/**
 * Group issues by table
 */
export function groupIssuesByTable(
  issues: ValidationIssue[]
): Map<string, ValidationIssue[]> {
  const grouped = new Map<string, ValidationIssue[]>();
  
  for (const issue of issues) {
    const existing = grouped.get(issue.tableName) || [];
    existing.push(issue);
    grouped.set(issue.tableName, existing);
  }
  
  return grouped;
}


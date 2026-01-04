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


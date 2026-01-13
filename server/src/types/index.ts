/**
 * Common Type Definitions for Backend
 * 
 * Types used across the backend for schema inspection,
 * validation, and sync operations.
 */

// ============================================
// Column Types
// ============================================

export interface DetailedColumn {
  name: string;
  dataType: string;
  udtName: string;
  isNullable: boolean;
  defaultValue: string | null;
  maxLength: number | null;
  numericPrecision: number | null;
  isPrimaryKey: boolean;
  ordinalPosition: number;
}

// ============================================
// Constraint Types
// ============================================

export interface ForeignKey {
  constraintName: string;
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete: string;
  onUpdate: string;
}

export interface TableConstraint {
  name: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK';
  columns: string[];
  definition: string;
}

export interface TableIndex {
  name: string;
  columns: string[];
  isUnique: boolean;
  isPrimary: boolean;
  indexType: string;
}

// ============================================
// Table Schema Types
// ============================================

export interface PrimaryKey {
  constraintName: string;
  columns: string[];
}

export interface DetailedTableSchema {
  tableName: string;
  columns: DetailedColumn[];
  primaryKey: PrimaryKey | null;
  foreignKeys: ForeignKey[];
  constraints: TableConstraint[];
  indexes: TableIndex[];
  rowCount: number;
  estimatedSize?: string;
}

// ============================================
// ENUM Types
// ============================================

export interface EnumType {
  name: string;
  schema: string;
  values: string[];
}

export interface DatabaseSchema {
  tables: DetailedTableSchema[];
  enums: EnumType[];
  syncableTables: string[];
  version: string;
  inspectedAt: Date;
}

// ============================================
// Validation Types
// ============================================

export type ValidationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  tableName: string;
  columnName?: string;
  category?: string;
  issue?: string;
  message: string;
  details?: string;
  recommendation: string;
  canAutoFix?: boolean;
}

export interface ColumnComparisonResult {
  columnName: string;
  sourceColumn: DetailedColumn | null;
  targetColumn: DetailedColumn | null;
  sourceType?: string | null;
  targetType?: string | null;
  isCompatible: boolean;
  issues: string[];
}

export interface TableComparisonResult {
  tableName: string;
  existsInSource: boolean;
  existsInTarget: boolean;
  isCompatible: boolean;
  status?: 'match' | 'missing_in_source' | 'missing_in_target' | 'schema_mismatch';
  columnComparison: ColumnComparisonResult[];
  foreignKeyIssues: string[];
  constraintIssues: string[];
  indexDifferences: string[];
}

export interface ValidationSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface SchemaValidationResult {
  isValid: boolean;
  canProceed: boolean;
  requiresConfirmation: boolean;
  issues: ValidationIssue[];
  summary: ValidationSummary;
  sourceSchema: DatabaseSchema;
  targetSchema: DatabaseSchema;
  comparisonDetails: TableComparisonResult[];
}

// ============================================
// Migration Types
// ============================================

export interface MigrationScript {
  tableName: string;
  operation: 'CREATE_TABLE' | 'ADD_COLUMN' | 'ALTER_COLUMN' | 'ADD_CONSTRAINT' | 'ADD_INDEX' | 'DROP_COLUMN' | 'DROP_TABLE';
  sql: string;
  isBreaking: boolean;
  requiresManualReview: boolean;
  estimatedImpact: 'low' | 'medium' | 'high';
  description: string;
}

export interface MigrationPlan {
  scripts: MigrationScript[];
  safeScripts: MigrationScript[];
  breakingScripts: MigrationScript[];
  manualReviewRequired: MigrationScript[];
  combinedSQL: string;
  rollbackSQL: string;
  estimatedDuration: string;
  riskLevel: 'low' | 'medium' | 'high';
}

// ============================================
// Sync Types
// ============================================

export interface SyncProgress {
  totalTables: number;
  completedTables: number;
  currentTable: string | null;
  totalRows: number;
  processedRows: number;
  insertedRows: number;
  updatedRows: number;
  skippedRows: number;
  errors: number;
}

export interface SyncCheckpoint {
  lastTable: string;
  lastRowId: string;
  lastUpdatedAt: string;
  processedTables: string[];
}

export interface TableConfig {
  tableName: string;
  enabled: boolean;
  conflictStrategy?: ConflictStrategy;
}

// ============================================
// Queue Types
// ============================================

export interface SyncJobData {
  jobId: string;
  userId: string;
  sourceConnectionId: string;
  targetConnectionId: string;
  tablesConfig: TableConfig[];
  direction: 'one_way' | 'two_way';
  checkpoint?: SyncCheckpoint;
  sourceUrl?: string;
  targetUrl?: string;
}

// ============================================
// Conflict Types
// ============================================

export type ConflictStrategy = 'last_write_wins' | 'source_wins' | 'target_wins' | 'manual';

export interface Conflict {
  id: string;
  tableName: string;
  rowId: string;
  sourceData: Record<string, unknown>;
  targetData: Record<string, unknown>;
  sourceUpdatedAt: Date;
  targetUpdatedAt: Date;
  resolution: 'pending' | 'source' | 'target' | 'merged';
}

// ============================================
// Diff Types
// ============================================

export interface ColumnDiff {
  columnName: string;
  sourceType: string | null;
  targetType: string | null;
  issue: 'missing_in_source' | 'missing_in_target' | 'type_mismatch' | 'compatible';
}

export interface SchemaDiff {
  tableName: string;
  missingInSource: boolean;
  missingInTarget: boolean;
  columnDifferences: ColumnDiff[];
}

export interface TableDiff {
  tableName: string;
  sourceRowCount: number;
  targetRowCount: number;
  inserts: number;
  updates: number;
  sampleInserts: Record<string, unknown>[];
  sampleUpdates: Record<string, unknown>[];
}

// ============================================
// API Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}


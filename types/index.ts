// Core type definitions for Supabase Syncer

export type Environment = 'production' | 'development';
export type SyncDirection = 'one_way' | 'two_way';
export type SyncStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused';
export type LogLevel = 'info' | 'warn' | 'error';
export type ConflictStrategy = 'last_write_wins' | 'source_wins' | 'target_wins' | 'manual';

// Database Connection
export interface Connection {
  id: string;
  name: string;
  encryptedUrl: string;
  environment: Environment;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectionInput {
  name: string;
  databaseUrl: string;
  environment: Environment;
}

// Table configuration for sync
export interface TableConfig {
  tableName: string;
  enabled: boolean;
  conflictStrategy?: ConflictStrategy;
}

// Sync Job
export interface SyncJob {
  id: string;
  sourceConnectionId: string;
  targetConnectionId: string;
  direction: SyncDirection;
  status: SyncStatus;
  tablesConfig: TableConfig[];
  progress: SyncProgress | null;
  checkpoint: SyncCheckpoint | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

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

// Sync Log
export interface SyncLog {
  id: string;
  syncJobId: string;
  level: LogLevel;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

// Diff Engine Types
export interface TableDiff {
  tableName: string;
  inserts: number;
  updates: number;
  sourceRowCount: number;
  targetRowCount: number;
  sampleInserts: Record<string, unknown>[];
  sampleUpdates: Record<string, unknown>[];
}

export interface SchemaDiff {
  tableName: string;
  missingInTarget: boolean;
  missingInSource: boolean;
  columnDifferences: ColumnDiff[];
}

export interface ColumnDiff {
  columnName: string;
  sourceType: string | null;
  targetType: string | null;
  issue: 'missing_in_target' | 'missing_in_source' | 'type_mismatch';
}

// Conflict for two-way sync
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

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Dry run result
export interface DryRunResult {
  tables: TableDiff[];
  schemaIssues: SchemaDiff[];
  estimatedDuration: number; // in seconds
  warnings: string[];
}

// Worker job data
export interface SyncJobData {
  jobId: string;
  sourceConnectionId: string;
  targetConnectionId: string;
  direction: SyncDirection;
  tablesConfig: TableConfig[];
  checkpoint?: SyncCheckpoint;
}

// Session types
export interface SessionPayload {
  authenticated: boolean;
  expiresAt: number;
}

// ============================================
// Schema Inspection Types
// ============================================

export interface DetailedColumn {
  name: string;
  dataType: string;
  udtName: string;  // underlying type (e.g., uuid, timestamptz)
  isNullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  maxLength: number | null;
  numericPrecision: number | null;
  ordinalPosition: number;
}

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

export interface DetailedTableSchema {
  tableName: string;
  columns: DetailedColumn[];
  primaryKey: {
    columns: string[];
    constraintName: string;
  } | null;
  foreignKeys: ForeignKey[];
  constraints: TableConstraint[];
  indexes: TableIndex[];
  rowCount: number;
  estimatedSize: string;
}

export interface DatabaseSchema {
  tables: DetailedTableSchema[];
  syncableTables: string[];
  version: string;
  inspectedAt: Date;
}

// ============================================
// Schema Validation Types
// ============================================

export type ValidationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  category: string;
  tableName: string;
  columnName?: string;
  message: string;
  details: string;
  recommendation: string;
}

export interface SchemaValidationResult {
  isValid: boolean;
  canProceed: boolean;
  requiresConfirmation: boolean;
  issues: ValidationIssue[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  sourceSchema: DatabaseSchema;
  targetSchema: DatabaseSchema;
  comparisonDetails: TableComparisonResult[];
}

export interface TableComparisonResult {
  tableName: string;
  existsInSource: boolean;
  existsInTarget: boolean;
  isCompatible: boolean;
  columnComparison: ColumnComparisonResult[];
  foreignKeyIssues: string[];
  constraintIssues: string[];
  indexDifferences: string[];
}

export interface ColumnComparisonResult {
  columnName: string;
  sourceColumn: DetailedColumn | null;
  targetColumn: DetailedColumn | null;
  isCompatible: boolean;
  issues: string[];
}

// Extended dry run result with validation
export interface EnhancedDryRunResult extends DryRunResult {
  validation: SchemaValidationResult;
}

// ============================================
// Scheduled Sync Types
// ============================================

export interface ScheduledSync {
  id: string;
  userId: string;
  name: string;
  sourceConnectionId: string;
  targetConnectionId: string;
  tables: TableConfig[];
  direction: SyncDirection;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  lastRunStatus: 'success' | 'failed' | 'running' | null;
  lastRunJobId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleInput {
  name: string;
  sourceConnectionId: string;
  targetConnectionId: string;
  tables: TableConfig[];
  direction: SyncDirection;
  cronExpression: string;
  timezone?: string;
  enabled?: boolean;
}


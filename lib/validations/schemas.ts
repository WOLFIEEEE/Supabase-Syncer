/**
 * Zod Validation Schemas
 * 
 * Centralized validation schemas for all API endpoints.
 */

import { z } from 'zod';

// ============================================
// Common Patterns
// ============================================

// PostgreSQL connection URL pattern
const postgresUrlPattern = /^postgres(ql)?:\/\/.+/i;

// UUID pattern
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Table name pattern (alphanumeric, underscore, no SQL injection)
const tableNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

// ============================================
// Connection Schemas
// ============================================

export const ConnectionInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  databaseUrl: z
    .string()
    .min(1, 'Database URL is required')
    .regex(postgresUrlPattern, 'Must be a valid PostgreSQL connection URL')
    .refine(
      (url) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      },
      'Invalid URL format'
    ),
  environment: z.enum(['production', 'development'], {
    message: 'Environment must be "production" or "development"',
  }),
});

export type ConnectionInput = z.infer<typeof ConnectionInputSchema>;

export const ConnectionIdSchema = z.object({
  id: z
    .string()
    .regex(uuidPattern, 'Invalid connection ID format'),
});

// ============================================
// Sync Job Schemas
// ============================================

export const TableConfigSchema = z.object({
  tableName: z
    .string()
    .min(1, 'Table name is required')
    .max(63, 'Table name too long') // PostgreSQL limit
    .regex(tableNamePattern, 'Invalid table name format'),
  enabled: z.boolean(),
  conflictStrategy: z
    .enum(['last_write_wins', 'source_wins', 'target_wins', 'manual'])
    .optional()
    .default('last_write_wins'),
});

export type TableConfig = z.infer<typeof TableConfigSchema>;

export const SyncJobInputSchema = z.object({
  sourceConnectionId: z
    .string()
    .regex(uuidPattern, 'Invalid source connection ID'),
  targetConnectionId: z
    .string()
    .regex(uuidPattern, 'Invalid target connection ID'),
  direction: z.enum(['one_way', 'two_way'], {
    message: 'Direction must be "one_way" or "two_way"',
  }),
  tables: z
    .array(TableConfigSchema)
    .min(1, 'At least one table must be selected')
    .max(100, 'Too many tables selected (max 100)'),
  dryRun: z.boolean().optional().default(false),
}).refine(
  (data) => data.sourceConnectionId !== data.targetConnectionId,
  {
    message: 'Source and target connections must be different',
    path: ['targetConnectionId'],
  }
);

export type SyncJobInput = z.infer<typeof SyncJobInputSchema>;

// ============================================
// Validation Schemas
// ============================================

export const ValidateInputSchema = z.object({
  sourceConnectionId: z
    .string()
    .regex(uuidPattern, 'Invalid source connection ID'),
  targetConnectionId: z
    .string()
    .regex(uuidPattern, 'Invalid target connection ID'),
  tables: z
    .array(z.union([
      z.string().regex(tableNamePattern, 'Invalid table name'),
      TableConfigSchema,
    ]))
    .optional()
    .default([]),
  direction: z
    .enum(['one_way', 'two_way'])
    .optional()
    .default('one_way'),
});

export type ValidateInput = z.infer<typeof ValidateInputSchema>;

// ============================================
// Migration Schemas
// ============================================

export const MigrationInputSchema = z.object({
  sourceConnectionId: z
    .string()
    .regex(uuidPattern, 'Invalid source connection ID'),
  targetConnectionId: z
    .string()
    .regex(uuidPattern, 'Invalid target connection ID'),
  tables: z
    .array(z.string().regex(tableNamePattern, 'Invalid table name'))
    .optional()
    .default([]),
  direction: z
    .enum(['source_to_target', 'target_to_source'])
    .optional()
    .default('source_to_target'),
  issueId: z.string().optional(),
});

export type MigrationInput = z.infer<typeof MigrationInputSchema>;

export const ExecuteSqlSchema = z.object({
  sql: z
    .string()
    .min(1, 'SQL query is required')
    .max(100000, 'SQL query too large (max 100KB)'),
  dryRun: z.boolean().optional().default(false),
});

export type ExecuteSqlInput = z.infer<typeof ExecuteSqlSchema>;

// ============================================
// Pagination Schemas
// ============================================

export const PaginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const num = parseInt(val || '50', 10);
      return Math.min(Math.max(1, num), 100); // Between 1 and 100
    }),
  offset: z
    .string()
    .optional()
    .transform((val) => {
      const num = parseInt(val || '0', 10);
      return Math.max(0, num);
    }),
});

export type Pagination = z.infer<typeof PaginationSchema>;

// ============================================
// Schedule Schemas
// ============================================

export const ScheduleInputSchema = z.object({
  syncJobId: z
    .string()
    .regex(uuidPattern, 'Invalid sync job ID')
    .optional(),
  sourceConnectionId: z
    .string()
    .regex(uuidPattern, 'Invalid source connection ID'),
  targetConnectionId: z
    .string()
    .regex(uuidPattern, 'Invalid target connection ID'),
  tables: z.array(TableConfigSchema).min(1),
  direction: z.enum(['one_way', 'two_way']),
  cronExpression: z
    .string()
    .min(9, 'Invalid cron expression')
    .max(100, 'Cron expression too long'),
  timezone: z
    .string()
    .max(50)
    .optional()
    .default('UTC'),
  enabled: z.boolean().optional().default(true),
});

export type ScheduleInput = z.infer<typeof ScheduleInputSchema>;

// ============================================
// Utility Functions
// ============================================

/**
 * Validate and parse input with Zod schema
 * Returns either the parsed data or formatted error messages
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Handle both newer and older Zod API
  const zodError = result.error;
  const issues = zodError.issues || [];
  
  const errors = issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    return `${path}${issue.message}`;
  });
  
  return { success: false, errors };
}

/**
 * Sanitize table name to prevent SQL injection
 */
export function sanitizeTableName(name: string): string | null {
  if (!tableNamePattern.test(name)) {
    return null;
  }
  // Additional check: must not be a reserved word
  const reserved = ['select', 'insert', 'update', 'delete', 'drop', 'alter', 'create', 'table'];
  if (reserved.includes(name.toLowerCase())) {
    return null;
  }
  return name;
}

/**
 * Sanitize multiple table names
 */
export function sanitizeTableNames(names: string[]): string[] {
  return names
    .map(sanitizeTableName)
    .filter((name): name is string => name !== null);
}


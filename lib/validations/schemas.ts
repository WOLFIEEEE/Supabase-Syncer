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

// ============================================
// Explorer Schemas
// ============================================

export const ExplorerRowSchema = z.object({
  // Row data can be any object with string keys
  data: z.record(z.string(), z.unknown()),
});

export type ExplorerRow = z.infer<typeof ExplorerRowSchema>;

export const ExplorerQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const num = parseInt(val || '50', 10);
      return Math.min(Math.max(1, num), 1000); // Between 1 and 1000
    }),
  offset: z
    .string()
    .optional()
    .transform((val) => {
      const num = parseInt(val || '0', 10);
      return Math.max(0, num);
    }),
  orderBy: z
    .string()
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid column name')
    .optional(),
  orderDir: z
    .enum(['asc', 'desc'])
    .optional()
    .default('asc'),
  filters: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return {};
      try {
        return JSON.parse(val);
      } catch {
        return {};
      }
    }),
});

export type ExplorerQuery = z.infer<typeof ExplorerQuerySchema>;

// ============================================
// Session Schemas
// ============================================

export const SessionIdSchema = z.object({
  id: z
    .string()
    .regex(uuidPattern, 'Invalid session ID format'),
});

export const SignOutAllSchema = z.object({
  keepCurrentSession: z.boolean().optional().default(false),
  currentSessionToken: z.string().optional(),
});

export type SignOutAllInput = z.infer<typeof SignOutAllSchema>;

// ============================================
// Security Schemas
// ============================================

export const SqlExecuteSchema = z.object({
  sql: z
    .string()
    .min(1, 'SQL query is required')
    .max(262144, 'SQL query too large (max 256KB)'), // 256KB limit
  confirmationPhrase: z
    .string()
    .optional(),
}).refine(
  (data) => {
    // Check for dangerous patterns
    const dangerousPatterns = [
      /;\s*DROP\s+/i,
      /;\s*DELETE\s+FROM\s+/i,
      /;\s*TRUNCATE\s+/i,
      /;\s*ALTER\s+TABLE\s+/i,
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(data.sql));
  },
  {
    message: 'SQL contains potentially dangerous patterns. Use caution.',
    path: ['sql'],
  }
);

export type SqlExecuteInput = z.infer<typeof SqlExecuteSchema>;

// ============================================
// Request Body Structure Validation
// ============================================

/**
 * Maximum allowed depth for nested objects
 */
const MAX_OBJECT_DEPTH = 10;

/**
 * Maximum allowed array length
 */
const MAX_ARRAY_LENGTH = 1000;

/**
 * Maximum allowed string length
 */
const MAX_STRING_LENGTH = 1000000; // 1MB

/**
 * Validate request body structure for security
 * Checks for deeply nested objects, oversized arrays, etc.
 */
export function validateBodyStructure(
  data: unknown,
  depth = 0
): { valid: boolean; error?: string } {
  // Check depth
  if (depth > MAX_OBJECT_DEPTH) {
    return {
      valid: false,
      error: `Object nesting too deep (max ${MAX_OBJECT_DEPTH} levels)`,
    };
  }
  
  // Null/undefined are valid
  if (data === null || data === undefined) {
    return { valid: true };
  }
  
  // Check arrays
  if (Array.isArray(data)) {
    if (data.length > MAX_ARRAY_LENGTH) {
      return {
        valid: false,
        error: `Array too long (max ${MAX_ARRAY_LENGTH} items)`,
      };
    }
    
    // Validate each item
    for (const item of data) {
      const result = validateBodyStructure(item, depth + 1);
      if (!result.valid) return result;
    }
    
    return { valid: true };
  }
  
  // Check strings
  if (typeof data === 'string') {
    if (data.length > MAX_STRING_LENGTH) {
      return {
        valid: false,
        error: `String too long (max ${MAX_STRING_LENGTH} characters)`,
      };
    }
    return { valid: true };
  }
  
  // Check objects
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    
    // Check number of keys
    if (keys.length > MAX_ARRAY_LENGTH) {
      return {
        valid: false,
        error: `Object has too many keys (max ${MAX_ARRAY_LENGTH})`,
      };
    }
    
    // Validate each value
    for (const key of keys) {
      // Validate key format (prevent prototype pollution)
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return {
          valid: false,
          error: `Invalid object key: ${key}`,
        };
      }
      
      const result = validateBodyStructure((data as Record<string, unknown>)[key], depth + 1);
      if (!result.valid) return result;
    }
    
    return { valid: true };
  }
  
  // Primitives are valid
  return { valid: true };
}

/**
 * Validate and parse request body with structure validation
 */
export function validateAndParseBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  // First, validate structure
  const structureResult = validateBodyStructure(data);
  if (!structureResult.valid) {
    return { success: false, error: structureResult.error || 'Invalid request body structure' };
  }
  
  // Then validate with schema
  const result = validateInput(schema, data);
  if (!result.success) {
    return { success: false, error: result.errors.join(', ') };
  }
  
  return { success: true, data: result.data };
}


/**
 * Security Utilities
 * 
 * Comprehensive security utilities for SQL injection prevention,
 * input validation, error sanitization, and CSRF protection.
 */

// ============================================================================
// SQL IDENTIFIER VALIDATION & SANITIZATION
// ============================================================================

/**
 * Strict regex for valid PostgreSQL identifiers
 * Only allows: letters, numbers, underscores (must start with letter or underscore)
 */
const VALID_IDENTIFIER_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Maximum identifier length in PostgreSQL
 */
const MAX_IDENTIFIER_LENGTH = 63;

/**
 * Reserved PostgreSQL keywords that shouldn't be used as identifiers
 */
const RESERVED_KEYWORDS = new Set([
  'all', 'analyse', 'analyze', 'and', 'any', 'array', 'as', 'asc', 'asymmetric',
  'both', 'case', 'cast', 'check', 'collate', 'column', 'constraint', 'create',
  'current_catalog', 'current_date', 'current_role', 'current_time',
  'current_timestamp', 'current_user', 'default', 'deferrable', 'desc',
  'distinct', 'do', 'else', 'end', 'except', 'false', 'fetch', 'for', 'foreign',
  'from', 'grant', 'group', 'having', 'in', 'initially', 'intersect', 'into',
  'lateral', 'leading', 'limit', 'localtime', 'localtimestamp', 'not', 'null',
  'offset', 'on', 'only', 'or', 'order', 'placing', 'primary', 'references',
  'returning', 'select', 'session_user', 'some', 'symmetric', 'table', 'then',
  'to', 'trailing', 'true', 'union', 'unique', 'user', 'using', 'variadic',
  'when', 'where', 'window', 'with',
]);

/**
 * Validate if a string is a safe PostgreSQL identifier
 * Uses strict whitelist validation
 */
export function isValidIdentifier(identifier: string): boolean {
  if (!identifier || typeof identifier !== 'string') return false;
  if (identifier.length === 0 || identifier.length > MAX_IDENTIFIER_LENGTH) return false;
  if (identifier.includes('\0')) return false; // No null bytes
  if (!VALID_IDENTIFIER_REGEX.test(identifier)) return false;
  return true;
}

/**
 * Validate if a string is a valid table name
 * More strict than general identifier validation
 */
export function isValidTableName(tableName: string): boolean {
  if (!isValidIdentifier(tableName)) return false;
  // Additional table name restrictions
  if (tableName.startsWith('pg_')) return false; // PostgreSQL system tables
  if (tableName.startsWith('sql_')) return false; // SQL standard tables
  return true;
}

/**
 * Validate multiple table names
 * Returns array of valid table names and array of rejected ones
 */
export function validateTableNames(tableNames: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];
  
  for (const name of tableNames) {
    if (isValidTableName(name)) {
      valid.push(name);
    } else {
      invalid.push(name);
    }
  }
  
  return { valid, invalid };
}

/**
 * Escape a PostgreSQL identifier (table name, column name)
 * Uses double-quote escaping with proper null byte removal
 * 
 * SECURITY: Always validates before escaping
 */
export function escapeIdentifier(identifier: string): string {
  if (!identifier || typeof identifier !== 'string') {
    throw new SecurityError('Invalid identifier: empty or not a string');
  }
  
  // Remove null bytes (security)
  const cleaned = identifier.replace(/\0/g, '');
  
  if (cleaned.length === 0) {
    throw new SecurityError('Invalid identifier: empty after cleaning');
  }
  
  if (cleaned.length > MAX_IDENTIFIER_LENGTH) {
    throw new SecurityError(`Invalid identifier: exceeds ${MAX_IDENTIFIER_LENGTH} characters`);
  }
  
  // Escape double quotes by doubling them
  const escaped = cleaned.replace(/"/g, '""');
  
  // Return quoted identifier
  return `"${escaped}"`;
}

/**
 * Escape a SQL string literal (for use in VALUES, WHERE, etc.)
 * Uses single-quote escaping
 * 
 * SECURITY: This should be used sparingly - prefer parameterized queries
 */
export function escapeLiteral(value: string): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (typeof value !== 'string') {
    value = String(value);
  }
  
  // Remove null bytes
  const cleaned = value.replace(/\0/g, '');
  
  // Escape single quotes by doubling them
  // Also escape backslashes for standard_conforming_strings = on (PostgreSQL default)
  const escaped = cleaned
    .replace(/'/g, "''");
  
  return `'${escaped}'`;
}

/**
 * Build a safe table list for SQL IN clause using ANY(ARRAY[...])
 * Uses parameterized approach where possible
 * 
 * SECURITY: Validates all table names before building SQL
 */
export function buildSafeTableArray(tableNames: string[]): {
  sql: string;
  values: string[];
} {
  if (!Array.isArray(tableNames) || tableNames.length === 0) {
    throw new SecurityError('Invalid table names: must be non-empty array');
  }
  
  const { valid, invalid } = validateTableNames(tableNames);
  
  if (invalid.length > 0) {
    throw new SecurityError(
      `Invalid table names rejected: ${invalid.slice(0, 3).join(', ')}${invalid.length > 3 ? '...' : ''}`
    );
  }
  
  // Build parameterized placeholders
  const placeholders = valid.map((_, i) => `$${i + 1}`).join(', ');
  
  return {
    sql: `ANY(ARRAY[${placeholders}]::text[])`,
    values: valid,
  };
}

/**
 * Build a safe table list for SQL using escaped literals
 * Use this when parameterized queries aren't possible (e.g., in CTEs)
 * 
 * SECURITY: Validates and escapes all table names
 */
export function buildSafeTableLiteralArray(tableNames: string[]): string {
  if (!Array.isArray(tableNames) || tableNames.length === 0) {
    throw new SecurityError('Invalid table names: must be non-empty array');
  }
  
  const { valid, invalid } = validateTableNames(tableNames);
  
  if (invalid.length > 0) {
    throw new SecurityError(
      `Invalid table names rejected: ${invalid.slice(0, 3).join(', ')}${invalid.length > 3 ? '...' : ''}`
    );
  }
  
  // Escape each table name as a literal
  return valid.map(t => escapeLiteral(t)).join(', ');
}

// ============================================================================
// ERROR SANITIZATION
// ============================================================================

/**
 * Patterns that indicate sensitive information in error messages
 */
const SENSITIVE_PATTERNS = [
  /postgresql?:\/\/[^@]+@/gi, // Connection strings
  /postgres:\/\/[^@]+@/gi,
  /password[=:]["']?[^"'\s]+/gi,
  /api[_-]?key[=:]["']?[^"'\s]+/gi,
  /secret[=:]["']?[^"'\s]+/gi,
  /token[=:]["']?[^"'\s]+/gi,
  /bearer\s+[a-zA-Z0-9._-]+/gi,
  /authorization[=:]["']?[^"'\s]+/gi,
  /\/home\/[^\/]+\//gi, // Home directory paths
  /\/Users\/[^\/]+\//gi,
  /C:\\Users\\[^\\]+\\/gi,
  /ENCRYPTION_KEY[=:]["']?[^"'\s]*/gi,
  /SUPABASE_[A-Z_]+[=:]["']?[^"'\s]*/gi,
];

/**
 * Generic error messages to replace sensitive information
 */
const ERROR_REPLACEMENTS: Record<string, string> = {
  'connection': 'Database connection error',
  'authentication': 'Authentication failed',
  'timeout': 'Operation timed out',
  'permission': 'Permission denied',
  'not found': 'Resource not found',
};

/**
 * Sanitize error message to remove sensitive information
 */
export function sanitizeErrorMessage(error: unknown): string {
  let message: string;
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else {
    return 'An unexpected error occurred';
  }
  
  // Remove sensitive patterns
  let sanitized = message;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  
  // Remove stack traces
  sanitized = sanitized.split('\n')[0] || sanitized;
  
  // Truncate very long messages
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500) + '...';
  }
  
  return sanitized;
}

/**
 * Create a safe error response for API routes
 */
export function createSafeErrorResponse(
  error: unknown,
  defaultMessage: string = 'An error occurred'
): { message: string; code?: string } {
  if (error instanceof SecurityError) {
    return {
      message: error.message,
      code: 'SECURITY_ERROR',
    };
  }
  
  if (error instanceof ValidationError) {
    return {
      message: error.message,
      code: 'VALIDATION_ERROR',
    };
  }
  
  // For other errors, sanitize the message
  const sanitized = sanitizeErrorMessage(error);
  
  // Check for known error types
  const lowerMessage = sanitized.toLowerCase();
  for (const [keyword, replacement] of Object.entries(ERROR_REPLACEMENTS)) {
    if (lowerMessage.includes(keyword)) {
      return {
        message: replacement,
        code: keyword.toUpperCase().replace(/\s/g, '_'),
      };
    }
  }
  
  return {
    message: defaultMessage,
  };
}

// ============================================================================
// CSRF PROTECTION
// ============================================================================

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token format
 */
export function isValidCSRFToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  // Token should be 64 hex characters (32 bytes)
  return /^[a-f0-9]{64}$/i.test(token);
}

/**
 * Validate Origin/Referer header for CSRF protection
 */
export function validateOrigin(
  requestOrigin: string | null,
  allowedOrigins: string[]
): boolean {
  if (!requestOrigin) return false;
  
  try {
    const originUrl = new URL(requestOrigin);
    const originHost = originUrl.origin;
    
    return allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        return allowedUrl.origin === originHost;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/**
 * Get allowed origins from environment
 */
export function getAllowedOrigins(): string[] {
  const origins: string[] = [];
  
  // Add app URL if configured
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    origins.push(appUrl);
  }
  
  // Always allow localhost in development
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000');
    origins.push('http://127.0.0.1:3000');
  }
  
  return origins;
}

// ============================================================================
// RATE LIMITING HELPERS
// ============================================================================

/**
 * Extract client identifier for rate limiting
 * Prefers user ID, falls back to IP
 */
export function getClientIdentifier(
  userId: string | null,
  ip: string | null
): string {
  if (userId) return `user:${userId}`;
  if (ip) return `ip:${ip}`;
  return 'unknown';
}

/**
 * Extract IP address from request headers
 */
export function extractIP(headers: Headers): string | null {
  // Check common proxy headers
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    // Take the first IP in the chain
    const firstIP = forwarded.split(',')[0].trim();
    if (firstIP) return firstIP;
  }
  
  const realIP = headers.get('x-real-ip');
  if (realIP) return realIP;
  
  return null;
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Validate batch size is within safe limits
 */
export function validateBatchSize(size: number, max: number = 1000): number {
  if (typeof size !== 'number' || isNaN(size)) return 100;
  if (size < 1) return 1;
  if (size > max) return max;
  return Math.floor(size);
}

/**
 * Validate limit/offset for pagination
 */
export function validatePagination(
  limit: number,
  offset: number,
  maxLimit: number = 1000
): { limit: number; offset: number } {
  return {
    limit: validateBatchSize(limit, maxLimit),
    offset: Math.max(0, Math.floor(offset || 0)),
  };
}

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Security-related error
 */
export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

/**
 * Validation-related error
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ============================================================================
// SQL QUERY BUILDING HELPERS
// ============================================================================

/**
 * Build a safe SELECT query
 */
export function buildSafeSelect(
  tableName: string,
  columns: string[] = ['*'],
  options: {
    where?: string;
    orderBy?: string;
    limit?: number;
    offset?: number;
  } = {}
): string {
  if (!isValidTableName(tableName)) {
    throw new SecurityError(`Invalid table name: ${tableName}`);
  }
  
  const safeTable = escapeIdentifier(tableName);
  const safeColumns = columns.map(c => c === '*' ? '*' : escapeIdentifier(c)).join(', ');
  
  let query = `SELECT ${safeColumns} FROM ${safeTable}`;
  
  if (options.where) {
    query += ` WHERE ${options.where}`;
  }
  
  if (options.orderBy && isValidIdentifier(options.orderBy)) {
    query += ` ORDER BY ${escapeIdentifier(options.orderBy)}`;
  }
  
  if (options.limit && options.limit > 0) {
    query += ` LIMIT ${Math.floor(options.limit)}`;
  }
  
  if (options.offset && options.offset > 0) {
    query += ` OFFSET ${Math.floor(options.offset)}`;
  }
  
  return query;
}

/**
 * Build a safe COUNT query
 */
export function buildSafeCount(tableName: string, where?: string): string {
  if (!isValidTableName(tableName)) {
    throw new SecurityError(`Invalid table name: ${tableName}`);
  }
  
  const safeTable = escapeIdentifier(tableName);
  let query = `SELECT COUNT(*) as count FROM ${safeTable}`;
  
  if (where) {
    query += ` WHERE ${where}`;
  }
  
  return query;
}


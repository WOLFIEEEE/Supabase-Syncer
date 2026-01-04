/**
 * SQL Validator Service
 * 
 * Validates SQL statements for safety before execution.
 * Provides syntax checking and risk assessment.
 */

export interface SqlValidationResult {
  isValid: boolean;
  isSafe: boolean;
  riskLevel: 'safe' | 'caution' | 'dangerous';
  errors: string[];
  warnings: string[];
  statementType: SqlStatementType;
  affectedObjects: string[];
}

export type SqlStatementType = 
  | 'SELECT'
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'CREATE'
  | 'ALTER'
  | 'DROP'
  | 'TRUNCATE'
  | 'GRANT'
  | 'REVOKE'
  | 'BEGIN'
  | 'COMMIT'
  | 'ROLLBACK'
  | 'OTHER'
  | 'MIXED';

// Dangerous SQL patterns
const DANGEROUS_PATTERNS = [
  { pattern: /DROP\s+(TABLE|DATABASE|SCHEMA|INDEX)/i, message: 'DROP statement detected - destructive' },
  { pattern: /TRUNCATE\s+TABLE/i, message: 'TRUNCATE statement - removes all data' },
  { pattern: /DELETE\s+FROM\s+\w+\s*(?:;|$)/i, message: 'DELETE without WHERE - removes all rows' },
  { pattern: /UPDATE\s+\w+\s+SET\s+[^;]+(?:;|$)(?!\s*WHERE)/i, message: 'UPDATE without WHERE - updates all rows' },
  { pattern: /ALTER\s+TABLE\s+\w+\s+DROP\s+COLUMN/i, message: 'DROP COLUMN - data loss' },
  { pattern: /ALTER\s+TABLE\s+\w+\s+ALTER\s+COLUMN\s+\w+\s+TYPE/i, message: 'TYPE change - potential data loss' },
];

// Caution patterns
const CAUTION_PATTERNS = [
  { pattern: /ALTER\s+TABLE/i, message: 'ALTER TABLE statement - modifies schema' },
  { pattern: /DELETE\s+FROM/i, message: 'DELETE statement - removes data' },
  { pattern: /UPDATE\s+/i, message: 'UPDATE statement - modifies data' },
  { pattern: /CREATE\s+INDEX/i, message: 'CREATE INDEX - may lock table' },
  { pattern: /DROP\s+INDEX/i, message: 'DROP INDEX - may affect performance' },
  { pattern: /GRANT|REVOKE/i, message: 'Permission change detected' },
];

// SQL injection patterns
const INJECTION_PATTERNS = [
  { pattern: /;\s*--/i, message: 'SQL comment after semicolon - potential injection' },
  { pattern: /'\s*OR\s+'1'\s*=\s*'1/i, message: 'Classic SQL injection pattern detected' },
  { pattern: /UNION\s+SELECT/i, message: 'UNION SELECT - potential injection' },
  { pattern: /;\s*(DROP|DELETE|TRUNCATE)/i, message: 'Stacked query with destructive command' },
  { pattern: /\/\*[\s\S]*?\*\//, message: 'SQL block comment detected' },
  { pattern: /xp_cmdshell|exec\s*\(/i, message: 'Dangerous system command detected' },
];

/**
 * Validate SQL statement
 */
export function validateSql(sql: string): SqlValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let isSafe = true;
  let riskLevel: 'safe' | 'caution' | 'dangerous' = 'safe';
  
  // Trim and normalize
  const normalizedSql = sql.trim();
  
  // Basic syntax checks
  if (!normalizedSql) {
    return {
      isValid: false,
      isSafe: false,
      riskLevel: 'safe',
      errors: ['Empty SQL statement'],
      warnings: [],
      statementType: 'OTHER',
      affectedObjects: [],
    };
  }
  
  // Check for injection patterns
  for (const { pattern, message } of INJECTION_PATTERNS) {
    if (pattern.test(normalizedSql)) {
      errors.push(`Security: ${message}`);
      isSafe = false;
      riskLevel = 'dangerous';
    }
  }
  
  // Check for dangerous patterns
  for (const { pattern, message } of DANGEROUS_PATTERNS) {
    if (pattern.test(normalizedSql)) {
      warnings.push(`Dangerous: ${message}`);
      riskLevel = 'dangerous';
    }
  }
  
  // Check for caution patterns (only if not already dangerous)
  if (riskLevel !== 'dangerous') {
    for (const { pattern, message } of CAUTION_PATTERNS) {
      if (pattern.test(normalizedSql)) {
        warnings.push(`Caution: ${message}`);
        if (riskLevel === 'safe') {
          riskLevel = 'caution';
        }
      }
    }
  }
  
  // Detect statement type
  const statementType = detectStatementType(normalizedSql);
  
  // Extract affected objects
  const affectedObjects = extractAffectedObjects(normalizedSql);
  
  // Check for balanced quotes and parentheses
  const quoteErrors = checkBalancedTokens(normalizedSql);
  errors.push(...quoteErrors);
  
  return {
    isValid: errors.length === 0,
    isSafe,
    riskLevel,
    errors,
    warnings,
    statementType,
    affectedObjects,
  };
}

/**
 * Detect the type of SQL statement
 */
function detectStatementType(sql: string): SqlStatementType {
  const normalized = sql.toUpperCase().trim();
  
  // Check for multiple statements
  const statements = sql.split(/;\s*/).filter((s) => s.trim());
  if (statements.length > 1) {
    return 'MIXED';
  }
  
  if (normalized.startsWith('SELECT')) return 'SELECT';
  if (normalized.startsWith('INSERT')) return 'INSERT';
  if (normalized.startsWith('UPDATE')) return 'UPDATE';
  if (normalized.startsWith('DELETE')) return 'DELETE';
  if (normalized.startsWith('CREATE')) return 'CREATE';
  if (normalized.startsWith('ALTER')) return 'ALTER';
  if (normalized.startsWith('DROP')) return 'DROP';
  if (normalized.startsWith('TRUNCATE')) return 'TRUNCATE';
  if (normalized.startsWith('GRANT')) return 'GRANT';
  if (normalized.startsWith('REVOKE')) return 'REVOKE';
  if (normalized.startsWith('BEGIN')) return 'BEGIN';
  if (normalized.startsWith('COMMIT')) return 'COMMIT';
  if (normalized.startsWith('ROLLBACK')) return 'ROLLBACK';
  
  return 'OTHER';
}

/**
 * Extract table/object names affected by the SQL
 */
function extractAffectedObjects(sql: string): string[] {
  const objects: string[] = [];
  
  // Match table names after FROM, INTO, UPDATE, TABLE keywords
  const patterns = [
    /FROM\s+(?:public\.)?["']?(\w+)["']?/gi,
    /INTO\s+(?:public\.)?["']?(\w+)["']?/gi,
    /UPDATE\s+(?:public\.)?["']?(\w+)["']?/gi,
    /TABLE\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?(?:public\.)?["']?(\w+)["']?/gi,
    /INDEX\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?["']?(\w+)["']?/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(sql)) !== null) {
      const objectName = match[1];
      if (objectName && !objects.includes(objectName)) {
        objects.push(objectName);
      }
    }
  }
  
  return objects;
}

/**
 * Check for balanced quotes and parentheses
 */
function checkBalancedTokens(sql: string): string[] {
  const errors: string[] = [];
  
  // Check single quotes
  const singleQuotes = (sql.match(/'/g) || []).length;
  if (singleQuotes % 2 !== 0) {
    errors.push('Unbalanced single quotes');
  }
  
  // Check double quotes
  const doubleQuotes = (sql.match(/"/g) || []).length;
  if (doubleQuotes % 2 !== 0) {
    errors.push('Unbalanced double quotes');
  }
  
  // Check parentheses
  let parenCount = 0;
  for (const char of sql) {
    if (char === '(') parenCount++;
    else if (char === ')') parenCount--;
    if (parenCount < 0) {
      errors.push('Unbalanced parentheses - extra closing paren');
      break;
    }
  }
  if (parenCount > 0) {
    errors.push('Unbalanced parentheses - missing closing paren');
  }
  
  return errors;
}

/**
 * Validate migration script
 */
export function validateMigrationScript(script: string): {
  isValid: boolean;
  statements: Array<{
    sql: string;
    validation: SqlValidationResult;
  }>;
  summary: {
    total: number;
    safe: number;
    caution: number;
    dangerous: number;
    invalid: number;
  };
} {
  // Split into statements
  const statements = script
    .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)  // Split on ; but not inside quotes
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--'));
  
  const results = statements.map((sql) => ({
    sql,
    validation: validateSql(sql),
  }));
  
  return {
    isValid: results.every((r) => r.validation.isValid),
    statements: results,
    summary: {
      total: results.length,
      safe: results.filter((r) => r.validation.riskLevel === 'safe').length,
      caution: results.filter((r) => r.validation.riskLevel === 'caution').length,
      dangerous: results.filter((r) => r.validation.riskLevel === 'dangerous').length,
      invalid: results.filter((r) => !r.validation.isValid).length,
    },
  };
}

/**
 * Wrap SQL in transaction for safety
 */
export function wrapInTransaction(sql: string): string {
  const trimmed = sql.trim();
  
  // Check if already wrapped
  if (/^\s*BEGIN/i.test(trimmed)) {
    return trimmed;
  }
  
  return `BEGIN;

${trimmed}

-- Uncomment to commit:
-- COMMIT;

-- Or rollback:
-- ROLLBACK;`;
}

/**
 * Generate dry-run version of SQL (adds EXPLAIN)
 */
export function generateDryRunSql(sql: string): string {
  const trimmed = sql.trim().toUpperCase();
  
  // Only SELECT, INSERT, UPDATE, DELETE can use EXPLAIN
  if (trimmed.startsWith('SELECT') || 
      trimmed.startsWith('INSERT') || 
      trimmed.startsWith('UPDATE') || 
      trimmed.startsWith('DELETE')) {
    return `EXPLAIN (ANALYZE false, COSTS true, FORMAT TEXT)\n${sql}`;
  }
  
  // For DDL, return as comment
  return `-- DRY RUN: The following statement would be executed:\n-- ${sql.replace(/\n/g, '\n-- ')}`;
}

/**
 * Estimate affected rows for a statement
 */
export async function estimateAffectedRows(
  sql: string,
  executeQuery: (query: string) => Promise<unknown[]>
): Promise<number | null> {
  const trimmed = sql.trim().toUpperCase();
  
  // Only for UPDATE/DELETE can we estimate
  if (!trimmed.startsWith('UPDATE') && !trimmed.startsWith('DELETE')) {
    return null;
  }
  
  try {
    // Convert to COUNT query
    const whereMatch = sql.match(/WHERE([\s\S]+)$/i);
    const fromMatch = sql.match(/(?:FROM|UPDATE)\s+["']?(\w+)["']?/i);
    
    if (fromMatch) {
      const table = fromMatch[1];
      const whereClause = whereMatch ? `WHERE ${whereMatch[1]}` : '';
      const countQuery = `SELECT COUNT(*) as count FROM "${table}" ${whereClause}`;
      
      const result = await executeQuery(countQuery);
      if (result[0] && typeof result[0] === 'object' && 'count' in result[0]) {
        return parseInt(String(result[0].count), 10);
      }
    }
  } catch {
    // Ignore errors - return null if we can't estimate
  }
  
  return null;
}


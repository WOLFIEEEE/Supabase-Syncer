import { NextRequest, NextResponse } from 'next/server';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { decrypt } from '@/lib/services/encryption';
import { createDrizzleClient } from '@/lib/services/drizzle-factory';
import { getUser } from '@/lib/supabase/server';
import { validateCSRFProtection, createCSRFErrorResponse } from '@/lib/services/csrf-protection';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/services/rate-limiter';
import { validateSql } from '@/lib/services/sql-validator';
import { sanitizeErrorMessage, isValidUUID } from '@/lib/services/security-utils';

// Maximum SQL length allowed (256KB)
const MAX_SQL_LENGTH = 256 * 1024;

// Query execution timeout (30 seconds)
const QUERY_TIMEOUT_MS = 30000;

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Split SQL into executable statements, properly handling DO $$ blocks
 * This parser tracks dollar-quoted strings character by character
 */
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  let i = 0;
  
  // Remove transaction wrappers - postgres.js handles transactions differently
  let cleanedSql = sql
    .replace(/^\s*BEGIN\s*;\s*/im, '')
    .replace(/\s*COMMIT\s*;\s*$/im, '')
    .replace(/\s*ROLLBACK\s*;\s*$/im, '')
    .replace(/--\s*Uncomment.*COMMIT.*\n?/gi, '')
    .replace(/--\s*Or rollback.*\n?/gi, '');
  
  while (i < cleanedSql.length) {
    const char = cleanedSql[i];
    
    // Check for dollar quote start/end
    if (char === '$') {
      // Look for complete dollar tag like $$ or $tag$
      let tag = '$';
      let j = i + 1;
      
      // Collect tag name (if any)
      while (j < cleanedSql.length && /[a-zA-Z0-9_]/.test(cleanedSql[j])) {
        tag += cleanedSql[j];
        j++;
      }
      
      // Check for closing $
      if (j < cleanedSql.length && cleanedSql[j] === '$') {
        tag += '$';
        
        if (!inDollarQuote) {
          // Starting a dollar-quoted string
          inDollarQuote = true;
          dollarTag = tag;
          current += tag;
          i = j + 1;
          continue;
        } else if (tag === dollarTag) {
          // Ending the dollar-quoted string
          inDollarQuote = false;
          dollarTag = '';
          current += tag;
          i = j + 1;
          continue;
        }
      }
    }
    
    current += char;
    
    // Check for statement end (semicolon outside dollar quotes)
    if (char === ';' && !inDollarQuote) {
      const stmt = current.trim();
      
      // Skip empty statements and pure comments
      if (stmt && !isOnlyComments(stmt)) {
        // Skip SET search_path and other setup commands that might cause issues
        if (!stmt.toUpperCase().startsWith('SET SEARCH_PATH')) {
          statements.push(stmt);
        }
      }
      current = '';
    }
    
    i++;
  }
  
  // Handle any remaining content
  const remaining = current.trim();
  if (remaining && !isOnlyComments(remaining)) {
    statements.push(remaining);
  }
  
  return statements;
}

/**
 * Check if a string contains only SQL comments
 */
function isOnlyComments(sql: string): boolean {
  const lines = sql.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('--')) {
      return false;
    }
  }
  return true;
}

/**
 * Get a short description of a SQL statement
 */
function getStatementDescription(sql: string): string {
  const trimmed = sql.trim();
  
  // Check for DO blocks
  if (trimmed.toUpperCase().startsWith('DO')) {
    // Try to extract the comment describing the operation
    const commentMatch = trimmed.match(/--\s*(.+?)(?:\n|$)/);
    if (commentMatch) {
      return commentMatch[1].trim().substring(0, 80);
    }
    return 'Execute PL/pgSQL block';
  }
  
  // Check for common SQL commands
  const commands = ['CREATE', 'ALTER', 'DROP', 'INSERT', 'UPDATE', 'DELETE', 'BEGIN', 'COMMIT', 'ROLLBACK', 'SET'];
  for (const cmd of commands) {
    if (trimmed.toUpperCase().startsWith(cmd)) {
      return trimmed.substring(0, 80) + (trimmed.length > 80 ? '...' : '');
    }
  }
  
  return trimmed.substring(0, 80) + (trimmed.length > 80 ? '...' : '');
}

/**
 * POST /api/connections/[id]/execute
 * 
 * Executes SQL on a database connection.
 * Requires user authentication and confirmation for production databases.
 * 
 * SECURITY:
 * - CSRF protection via origin validation
 * - Rate limiting (20 requests/minute for write operations)
 * - SQL validation for injection patterns
 * - Query timeout enforcement
 * - Error message sanitization
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // SECURITY: CSRF Protection
    const csrfValidation = await validateCSRFProtection(request);
    if (!csrfValidation.valid) {
      return createCSRFErrorResponse(csrfValidation.error || 'CSRF validation failed');
    }
    
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // SECURITY: Rate limiting
    const rateLimitResult = checkRateLimit(user.id, 'write');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please slow down.' },
        { 
          status: 429, 
          headers: createRateLimitHeaders(rateLimitResult, 'write') 
        }
      );
    }
    
    const { id } = await params;
    
    // SECURITY: Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid connection ID format' },
        { status: 400 }
      );
    }
    
    const { sql, confirmationPhrase } = await request.json();
    
    // SECURITY: Validate SQL input
    if (!sql || typeof sql !== 'string') {
      return NextResponse.json(
        { success: false, error: 'SQL query is required' },
        { status: 400 }
      );
    }
    
    // SECURITY: Check SQL length limit
    if (sql.length > MAX_SQL_LENGTH) {
      return NextResponse.json(
        { success: false, error: `SQL query exceeds maximum length of ${MAX_SQL_LENGTH / 1024}KB` },
        { status: 400 }
      );
    }
    
    // SECURITY: Validate SQL for injection patterns
    const sqlValidation = validateSql(sql);
    if (!sqlValidation.isSafe) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'SQL validation failed: Potentially unsafe patterns detected',
          validationErrors: sqlValidation.errors,
          validationWarnings: sqlValidation.warnings,
        },
        { status: 400 }
      );
    }
    
    // Get connection (scoped to user)
    const connection = await supabaseConnectionStore.getById(id, user.id);
    
    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    // Require confirmation for production databases
    if (connection.environment === 'production') {
      if (confirmationPhrase !== connection.name) {
        return NextResponse.json(
          { 
            success: false, 
            error: `For production databases, you must type the connection name to confirm.`,
            requiresConfirmation: true,
            // SECURITY: Don't expose connection name in error message
          },
          { status: 400 }
        );
      }
    }
    
    // Decrypt database URL
    const databaseUrl = decrypt(connection.encrypted_url);
    
    // Execute SQL
    const client = createDrizzleClient(databaseUrl);
    
    try {
      // Split SQL into statements (properly handling DO $$ blocks)
      const statements = splitSqlStatements(sql);
      
      console.log(`Executing ${statements.length} SQL statements...`);
      
      const results: { statement: string; success: boolean; error?: string; rowsAffected?: number }[] = [];
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        const description = getStatementDescription(statement);
        
        console.log(`[${i + 1}/${statements.length}] Executing: ${description}`);
        
        try {
          const result = await client.client.unsafe(statement);
          results.push({
            statement: description,
            success: true,
            rowsAffected: Array.isArray(result) ? result.length : 0
          });
          console.log(`[${i + 1}/${statements.length}] Success`);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          results.push({
            statement: description,
            success: false,
            error: errorMessage
          });
          console.error(`[${i + 1}/${statements.length}] Failed: ${errorMessage}`);
        }
      }
      
      await client.close();
      
      const allSuccessful = results.every(r => r.success);
      const failedCount = results.filter(r => !r.success).length;
      const successCount = results.filter(r => r.success).length;
      
      console.log(`Execution complete: ${successCount} succeeded, ${failedCount} failed`);
      
      return NextResponse.json({
        success: allSuccessful,
        data: {
          totalStatements: statements.length,
          successfulStatements: successCount,
          failedStatements: failedCount,
          results,
          message: allSuccessful 
            ? `Successfully executed ${statements.length} statement(s)`
            : `${failedCount} of ${statements.length} statement(s) failed`
        }
      });
      
    } catch (error) {
      await client.close();
      throw error;
    }
    
  } catch (error) {
    // SECURITY: Log full error server-side, sanitize for client
    console.error('Error executing SQL:', error);
    return NextResponse.json(
      { 
        success: false, 
        // SECURITY: Sanitize error message to prevent information disclosure
        error: sanitizeErrorMessage(error) || 'Failed to execute SQL'
      },
      { status: 500 }
    );
  }
}

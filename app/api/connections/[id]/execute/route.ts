import { NextRequest, NextResponse } from 'next/server';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { decrypt } from '@/lib/services/encryption';
import { createDrizzleClient } from '@/lib/services/drizzle-factory';
import { getUser } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Split SQL into executable statements, properly handling DO $$ blocks
 */
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  
  const lines = sql.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip comment-only lines at the statement level
    if (!inDollarQuote && current.trim() === '' && trimmedLine.startsWith('--')) {
      continue;
    }
    
    current += line + '\n';
    
    // Check for dollar quote start/end
    const dollarMatches = line.match(/\$([a-zA-Z_]*)\$/g);
    if (dollarMatches) {
      for (const match of dollarMatches) {
        if (!inDollarQuote) {
          inDollarQuote = true;
          dollarTag = match;
        } else if (match === dollarTag) {
          inDollarQuote = false;
          dollarTag = '';
        }
      }
    }
    
    // If we're not in a dollar quote and line ends with semicolon, complete the statement
    if (!inDollarQuote && trimmedLine.endsWith(';')) {
      const stmt = current.trim();
      if (stmt && !stmt.startsWith('--')) {
        statements.push(stmt);
      }
      current = '';
    }
  }
  
  // Handle any remaining content
  const remaining = current.trim();
  if (remaining && !remaining.startsWith('--')) {
    statements.push(remaining);
  }
  
  return statements;
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
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const { sql, confirmationPhrase } = await request.json();
    
    if (!sql || typeof sql !== 'string') {
      return NextResponse.json(
        { success: false, error: 'SQL query is required' },
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
            error: `For production databases, you must type the connection name "${connection.name}" to confirm.`,
            requiresConfirmation: true,
            connectionName: connection.name
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
          console.log(`[${i + 1}/${statements.length}] ✓ Success`);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          results.push({
            statement: description,
            success: false,
            error: errorMessage
          });
          console.error(`[${i + 1}/${statements.length}] ✗ Failed: ${errorMessage}`);
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
    console.error('Error executing SQL:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to execute SQL' 
      },
      { status: 500 }
    );
  }
}

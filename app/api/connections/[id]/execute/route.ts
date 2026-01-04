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
      // Split SQL into statements and execute each
      const statements = sql
        .split(';')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      
      const results: { statement: string; success: boolean; error?: string; rowsAffected?: number }[] = [];
      
      for (const statement of statements) {
        try {
          const result = await client.client.unsafe(statement);
          results.push({
            statement: statement.substring(0, 100) + (statement.length > 100 ? '...' : ''),
            success: true,
            rowsAffected: Array.isArray(result) ? result.length : 0
          });
        } catch (err) {
          results.push({
            statement: statement.substring(0, 100) + (statement.length > 100 ? '...' : ''),
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      }
      
      await client.close();
      
      const allSuccessful = results.every(r => r.success);
      const failedCount = results.filter(r => !r.success).length;
      
      return NextResponse.json({
        success: allSuccessful,
        data: {
          totalStatements: statements.length,
          successfulStatements: statements.length - failedCount,
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

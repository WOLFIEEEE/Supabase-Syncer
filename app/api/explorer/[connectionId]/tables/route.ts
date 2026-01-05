/**
 * Explorer Tables API
 * 
 * Lists all tables in a connection with stats (row count, column count, size)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { decrypt } from '@/lib/services/encryption';
import { createDrizzleClient, type DrizzleConnection } from '@/lib/services/drizzle-factory';

interface TableInfo {
  name: string;
  rowCount: number;
  columnCount: number;
  sizeBytes: number | null;
  columns: Array<{
    name: string;
    type: string;
    isPrimaryKey: boolean;
  }>;
  hasPrimaryKey: boolean;
  foreignKeyCount: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  let connection: DrizzleConnection | null = null;
  
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { connectionId } = await params;
    
    // Get connection from store
    const dbConnection = await supabaseConnectionStore.getById(connectionId, user.id);
    
    if (!dbConnection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    // Decrypt the connection URL
    const databaseUrl = decrypt(dbConnection.encrypted_url);
    connection = createDrizzleClient(databaseUrl);
    
    // Get all tables with their stats in parallel queries
    const [tablesResult, columnsResult, pkResult, fkResult, statsResult] = await Promise.all([
      // Get table names
      connection.client`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `,
      // Get all columns
      connection.client`
        SELECT 
          table_name,
          column_name,
          data_type,
          udt_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
      `,
      // Get primary keys
      connection.client`
        SELECT
          tc.table_name,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
      `,
      // Get foreign key counts
      connection.client`
        SELECT
          tc.table_name,
          COUNT(*) as fk_count
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        GROUP BY tc.table_name
      `,
      // Get table stats (row count and size)
      connection.client`
        SELECT
          relname as table_name,
          n_live_tup as row_count,
          pg_total_relation_size(quote_ident(relname)) as size_bytes
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
      `,
    ]);
    
    // Build lookup maps
    const columnsMap = new Map<string, Array<{ name: string; type: string }>>();
    for (const col of columnsResult) {
      const tableName = col.table_name as string;
      if (!columnsMap.has(tableName)) {
        columnsMap.set(tableName, []);
      }
      columnsMap.get(tableName)!.push({
        name: col.column_name as string,
        type: (col.udt_name as string) || (col.data_type as string),
      });
    }
    
    const pkMap = new Map<string, Set<string>>();
    for (const pk of pkResult) {
      const tableName = pk.table_name as string;
      if (!pkMap.has(tableName)) {
        pkMap.set(tableName, new Set());
      }
      pkMap.get(tableName)!.add(pk.column_name as string);
    }
    
    const fkCountMap = new Map<string, number>();
    for (const fk of fkResult) {
      fkCountMap.set(fk.table_name as string, Number(fk.fk_count) || 0);
    }
    
    const statsMap = new Map<string, { rowCount: number; sizeBytes: number | null }>();
    for (const stat of statsResult) {
      statsMap.set(stat.table_name as string, {
        rowCount: Number(stat.row_count) || 0,
        sizeBytes: stat.size_bytes ? Number(stat.size_bytes) : null,
      });
    }
    
    // Build table info array
    const tables: TableInfo[] = tablesResult.map((table) => {
      const tableName = table.table_name as string;
      const columns = columnsMap.get(tableName) || [];
      const pkColumns = pkMap.get(tableName) || new Set();
      const stats = statsMap.get(tableName) || { rowCount: 0, sizeBytes: null };
      
      return {
        name: tableName,
        rowCount: stats.rowCount,
        columnCount: columns.length,
        sizeBytes: stats.sizeBytes,
        columns: columns.slice(0, 5).map((col) => ({
          name: col.name,
          type: col.type,
          isPrimaryKey: pkColumns.has(col.name),
        })),
        hasPrimaryKey: pkColumns.size > 0,
        foreignKeyCount: fkCountMap.get(tableName) || 0,
      };
    });
    
    return NextResponse.json({
      success: true,
      data: {
        tables,
        connection: {
          id: dbConnection.id,
          name: dbConnection.name,
          environment: dbConnection.environment,
        },
      },
    });
    
  } catch (error) {
    console.error('[Explorer Tables]', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch tables';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}


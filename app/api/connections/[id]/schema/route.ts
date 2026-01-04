import { NextRequest, NextResponse } from 'next/server';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { decrypt } from '@/lib/services/encryption';
import { inspectDatabaseSchema } from '@/lib/services/schema-inspector';
import { getUser } from '@/lib/supabase/server';
import type { DetailedTableSchema, DetailedColumn, ForeignKey, TableIndex } from '@/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/connections/[id]/schema
 * 
 * Returns full schema inspection for a database connection including:
 * - All tables with detailed column info
 * - Primary keys, foreign keys, constraints
 * - Indexes
 * - Row counts and sizes
 * - List of syncable tables
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    // Get connection
    const connection = await supabaseConnectionStore.getById(id, user.id);
    
    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    // Decrypt database URL
    const databaseUrl = decrypt(connection.encrypted_url);
    
    // Inspect schema
    const schema = await inspectDatabaseSchema(databaseUrl);
    
    // Transform to UI-friendly format
    const tables = schema.tables.map((table: DetailedTableSchema) => {
      // Build a map of column name -> foreign key reference
      const fkMap = new Map<string, string>();
      for (const fk of table.foreignKeys) {
        fkMap.set(
          fk.columnName, 
          `${fk.referencedTable}(${fk.referencedColumn})`
        );
      }
      
      return {
        name: table.tableName,
        columns: table.columns.map((col: DetailedColumn) => ({
          name: col.name,
          type: col.udtName || col.dataType,
          nullable: col.isNullable,
          defaultValue: col.defaultValue,
          isPrimaryKey: col.isPrimaryKey,
          isForeignKey: fkMap.has(col.name),
          foreignKeyRef: fkMap.get(col.name) || null,
        })),
        rowCount: table.rowCount || 0,
        primaryKeys: table.primaryKey?.columns || [],
        foreignKeys: table.foreignKeys.map((fk: ForeignKey) => ({
          column: fk.columnName,
          references: `${fk.referencedTable}(${fk.referencedColumn})`,
        })),
        indexes: table.indexes.map((idx: TableIndex) => 
          `${idx.name} (${idx.columns.join(', ')})${idx.isUnique ? ' UNIQUE' : ''}`
        ),
      };
    });
    
    const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);
    
    return NextResponse.json({
      success: true,
      data: {
        connectionId: connection.id,
        connectionName: connection.name,
        environment: connection.environment,
        tables,
        totalTables: tables.length,
        totalRows,
        syncableTables: schema.syncableTables,
        version: schema.version,
        inspectedAt: schema.inspectedAt,
      },
    });
    
  } catch (error) {
    console.error('Error inspecting schema:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to inspect schema' 
      },
      { status: 500 }
    );
  }
}

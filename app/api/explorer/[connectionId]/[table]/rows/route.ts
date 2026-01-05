/**
 * Explorer Rows API
 * 
 * Fetches rows from a table with pagination, sorting, and filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { decrypt } from '@/lib/services/encryption';
import { createDrizzleClient, type DrizzleConnection } from '@/lib/services/drizzle-factory';

// Safety limits
const MAX_ROWS = 1000;
const DEFAULT_LIMIT = 50;

interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  defaultValue: string | null;
}

function sanitizeIdentifier(name: string): string {
  // Remove any characters that aren't alphanumeric, underscore, or space
  // Then wrap in double quotes
  const cleaned = name.replace(/[^\w\s]/g, '').trim();
  return `"${cleaned}"`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ connectionId: string; table: string }> }
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
    
    const { connectionId, table } = await params;
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query params
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(MAX_ROWS, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT))));
    const sortBy = searchParams.get('sortBy') || null;
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'DESC' : 'ASC';
    const search = searchParams.get('search') || null;
    
    // Get connection from store
    const dbConnection = await supabaseConnectionStore.getById(connectionId, user.id);
    
    if (!dbConnection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    // Decrypt and connect
    const databaseUrl = decrypt(dbConnection.encrypted_url);
    connection = createDrizzleClient(databaseUrl);
    
    const tableName = sanitizeIdentifier(table);
    
    // Verify table exists and get schema
    const schemaResult = await connection.client`
      SELECT 
        c.column_name,
        c.data_type,
        c.udt_name,
        c.is_nullable,
        c.column_default,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = ${table}
      ) pk ON c.column_name = pk.column_name
      WHERE c.table_schema = 'public'
        AND c.table_name = ${table}
      ORDER BY c.ordinal_position
    `;
    
    if (schemaResult.length === 0) {
      return NextResponse.json(
        { success: false, error: `Table "${table}" not found` },
        { status: 404 }
      );
    }
    
    const columns: ColumnSchema[] = schemaResult.map((col) => ({
      name: col.column_name as string,
      type: (col.udt_name as string) || (col.data_type as string),
      nullable: col.is_nullable === 'YES',
      isPrimaryKey: col.is_primary_key as boolean,
      defaultValue: col.column_default as string | null,
    }));
    
    // Find primary key for ordering
    const primaryKeyCol = columns.find((c) => c.isPrimaryKey)?.name;
    const orderByCol = sortBy || primaryKeyCol || columns[0]?.name || 'id';
    const safeOrderCol = sanitizeIdentifier(orderByCol);
    
    // Get total count
    const countResult = await connection.client.unsafe(
      `SELECT COUNT(*) as total FROM ${tableName}`
    );
    const totalRows = parseInt(countResult[0]?.total as string) || 0;
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Build and execute query
    let query = `SELECT * FROM ${tableName}`;
    
    // Add search filter if provided (searches all text-like columns)
    if (search) {
      const textColumns = columns.filter((c) => 
        ['text', 'varchar', 'char', 'name', 'uuid'].includes(c.type.toLowerCase())
      );
      if (textColumns.length > 0) {
        const searchConditions = textColumns
          .map((c) => `${sanitizeIdentifier(c.name)}::text ILIKE $1`)
          .join(' OR ');
        query += ` WHERE (${searchConditions})`;
      }
    }
    
    query += ` ORDER BY ${safeOrderCol} ${sortOrder}`;
    query += ` LIMIT ${limit} OFFSET ${offset}`;
    
    let rows;
    if (search) {
      rows = await connection.client.unsafe(query, [`%${search}%`]);
    } else {
      rows = await connection.client.unsafe(query);
    }
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalRows / limit);
    
    return NextResponse.json({
      success: true,
      data: {
        rows: rows.map((row) => ({ ...row })),
        columns,
        pagination: {
          page,
          limit,
          totalRows,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        table: {
          name: table,
          primaryKey: primaryKeyCol || null,
        },
      },
    });
    
  } catch (error) {
    console.error('[Explorer Rows]', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch rows';
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


/**
 * Explorer Single Row API
 * 
 * CRUD operations for individual rows (no bulk operations for safety)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { decrypt } from '@/lib/services/encryption';
import { createDrizzleClient, type DrizzleConnection } from '@/lib/services/drizzle-factory';

function sanitizeIdentifier(name: string): string {
  const cleaned = name.replace(/[^\w\s]/g, '').trim();
  return `"${cleaned}"`;
}

function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object' && !(value instanceof Date)) {
    return JSON.stringify(value);
  }
  return value;
}

async function getTablePrimaryKey(
  connection: DrizzleConnection,
  tableName: string
): Promise<string | null> {
  const result = await connection.client`
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = ${tableName}
    LIMIT 1
  `;
  return result[0]?.column_name as string || null;
}

async function getTableColumns(
  connection: DrizzleConnection,
  tableName: string
): Promise<string[]> {
  const result = await connection.client`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
    ORDER BY ordinal_position
  `;
  return result.map((r) => r.column_name as string);
}

/**
 * GET - Fetch a single row by ID
 */
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
    const rowId = searchParams.get('id');
    
    if (!rowId) {
      return NextResponse.json(
        { success: false, error: 'Row ID is required' },
        { status: 400 }
      );
    }
    
    const dbConnection = await supabaseConnectionStore.getById(connectionId, user.id);
    
    if (!dbConnection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    const databaseUrl = decrypt(dbConnection.encrypted_url);
    connection = createDrizzleClient(databaseUrl);
    
    const primaryKey = await getTablePrimaryKey(connection, table);
    
    if (!primaryKey) {
      return NextResponse.json(
        { success: false, error: 'Table has no primary key' },
        { status: 400 }
      );
    }
    
    const tableName = sanitizeIdentifier(table);
    const pkColumn = sanitizeIdentifier(primaryKey);
    
    const result = await connection.client.unsafe(
      `SELECT * FROM ${tableName} WHERE ${pkColumn} = $1 LIMIT 1`,
      [rowId]
    );
    
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Row not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { ...result[0] },
    });
    
  } catch (error) {
    console.error('[Explorer Row GET]', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch row';
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

/**
 * POST - Insert a new row
 */
export async function POST(
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
    const body = await request.json();
    const { data } = body;
    
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Row data is required' },
        { status: 400 }
      );
    }
    
    const dbConnection = await supabaseConnectionStore.getById(connectionId, user.id);
    
    if (!dbConnection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    // Warn for production databases
    if (dbConnection.environment === 'production') {
      const confirmHeader = request.headers.get('X-Confirm-Production');
      if (confirmHeader !== 'true') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Production write requires confirmation',
            requiresConfirmation: true,
          },
          { status: 400 }
        );
      }
    }
    
    const databaseUrl = decrypt(dbConnection.encrypted_url);
    connection = createDrizzleClient(databaseUrl);
    
    const tableColumns = await getTableColumns(connection, table);
    const tableName = sanitizeIdentifier(table);
    
    // Filter to only valid columns
    const validColumns = Object.keys(data).filter((col) => tableColumns.includes(col));
    
    if (validColumns.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid columns provided' },
        { status: 400 }
      );
    }
    
    const columnNames = validColumns.map(sanitizeIdentifier).join(', ');
    const placeholders = validColumns.map((_, i) => `$${i + 1}`).join(', ');
    const values = validColumns.map((col) => serializeValue(data[col])) as (string | number | boolean | null)[];
    
    const query = `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders}) RETURNING *`;
    const result = await connection.client.unsafe(query, values);
    
    return NextResponse.json({
      success: true,
      data: { ...result[0] },
      message: 'Row inserted successfully',
    });
    
  } catch (error) {
    console.error('[Explorer Row POST]', error);
    const message = error instanceof Error ? error.message : 'Failed to insert row';
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

/**
 * PUT - Update a single row
 */
export async function PUT(
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
    const body = await request.json();
    const { id, field, value, data } = body;
    
    // Support both single-field update and full-row update
    const updateData = data || (field ? { [field]: value } : null);
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Row ID is required' },
        { status: 400 }
      );
    }
    
    if (!updateData || Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Update data is required' },
        { status: 400 }
      );
    }
    
    const dbConnection = await supabaseConnectionStore.getById(connectionId, user.id);
    
    if (!dbConnection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    // Warn for production databases
    if (dbConnection.environment === 'production') {
      const confirmHeader = request.headers.get('X-Confirm-Production');
      if (confirmHeader !== 'true') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Production write requires confirmation',
            requiresConfirmation: true,
          },
          { status: 400 }
        );
      }
    }
    
    const databaseUrl = decrypt(dbConnection.encrypted_url);
    connection = createDrizzleClient(databaseUrl);
    
    const primaryKey = await getTablePrimaryKey(connection, table);
    
    if (!primaryKey) {
      return NextResponse.json(
        { success: false, error: 'Table has no primary key' },
        { status: 400 }
      );
    }
    
    const tableColumns = await getTableColumns(connection, table);
    const tableName = sanitizeIdentifier(table);
    const pkColumn = sanitizeIdentifier(primaryKey);
    
    // Filter to only valid columns (exclude primary key from updates)
    const validColumns = Object.keys(updateData).filter(
      (col) => tableColumns.includes(col) && col !== primaryKey
    );
    
    if (validColumns.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid columns to update' },
        { status: 400 }
      );
    }
    
    const setClause = validColumns
      .map((col, i) => `${sanitizeIdentifier(col)} = $${i + 1}`)
      .join(', ');
    const values: (string | number | boolean | null)[] = validColumns.map((col) => serializeValue(updateData[col]) as string | number | boolean | null);
    values.push(id as string); // For WHERE clause
    
    const query = `UPDATE ${tableName} SET ${setClause} WHERE ${pkColumn} = $${values.length} RETURNING *`;
    const result = await connection.client.unsafe(query, values);
    
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Row not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { ...result[0] },
      message: 'Row updated successfully',
    });
    
  } catch (error) {
    console.error('[Explorer Row PUT]', error);
    const message = error instanceof Error ? error.message : 'Failed to update row';
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

/**
 * DELETE - Delete a single row
 */
export async function DELETE(
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
    const rowId = searchParams.get('id');
    
    if (!rowId) {
      return NextResponse.json(
        { success: false, error: 'Row ID is required' },
        { status: 400 }
      );
    }
    
    const dbConnection = await supabaseConnectionStore.getById(connectionId, user.id);
    
    if (!dbConnection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    // Warn for production databases
    if (dbConnection.environment === 'production') {
      const confirmHeader = request.headers.get('X-Confirm-Production');
      if (confirmHeader !== 'true') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Production delete requires confirmation',
            requiresConfirmation: true,
          },
          { status: 400 }
        );
      }
    }
    
    const databaseUrl = decrypt(dbConnection.encrypted_url);
    connection = createDrizzleClient(databaseUrl);
    
    const primaryKey = await getTablePrimaryKey(connection, table);
    
    if (!primaryKey) {
      return NextResponse.json(
        { success: false, error: 'Table has no primary key' },
        { status: 400 }
      );
    }
    
    const tableName = sanitizeIdentifier(table);
    const pkColumn = sanitizeIdentifier(primaryKey);
    
    const result = await connection.client.unsafe(
      `DELETE FROM ${tableName} WHERE ${pkColumn} = $1 RETURNING *`,
      [rowId]
    );
    
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Row not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { ...result[0] },
      message: 'Row deleted successfully',
    });
    
  } catch (error) {
    console.error('[Explorer Row DELETE]', error);
    const message = error instanceof Error ? error.message : 'Failed to delete row';
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


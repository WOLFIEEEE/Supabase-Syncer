import { NextRequest, NextResponse } from 'next/server';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { decrypt } from '@/lib/services/encryption';
import { getSyncableTables, testConnection } from '@/lib/services/drizzle-factory';
import { getUser } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Get connection details
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
    
    const connection = await supabaseConnectionStore.getById(id, user.id);
    
    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: connection.id,
        name: connection.name,
        environment: connection.environment,
        createdAt: connection.created_at,
        updatedAt: connection.updated_at,
      },
    });
    
  } catch (error) {
    console.error('Error fetching connection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch connection' },
      { status: 500 }
    );
  }
}

// POST - Test connection and get tables
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
    
    const connection = await supabaseConnectionStore.getById(id, user.id);
    
    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    // Decrypt and test connection
    const databaseUrl = decrypt(connection.encrypted_url);
    const testResult = await testConnection(databaseUrl);
    
    if (!testResult.success) {
      return NextResponse.json(
        { success: false, error: `Connection failed: ${testResult.error}` },
        { status: 400 }
      );
    }
    
    // Get syncable tables
    const tables = await getSyncableTables(databaseUrl);
    
    return NextResponse.json({
      success: true,
      data: {
        id: connection.id,
        name: connection.name,
        environment: connection.environment,
        version: testResult.version,
        syncableTables: tables,
      },
    });
    
  } catch (error) {
    console.error('Error testing connection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}

// DELETE - Delete connection
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    const connection = await supabaseConnectionStore.getById(id, user.id);
    
    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    await supabaseConnectionStore.delete(id, user.id);
    
    return NextResponse.json({
      success: true,
      message: 'Connection deleted',
    });
    
  } catch (error) {
    console.error('Error deleting connection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}

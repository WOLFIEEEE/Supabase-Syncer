import { NextRequest, NextResponse } from 'next/server';
import { connectionStore } from '@/lib/db/memory-store';
import { encrypt, validateDatabaseUrl, maskDatabaseUrl } from '@/lib/services/encryption';
import { testConnection, getSyncableTables } from '@/lib/services/drizzle-factory';
import { getUser } from '@/lib/supabase/server';
import type { Environment } from '@/types';

// GET - List all connections for the authenticated user
export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const allConnections = connectionStore.getAll(user.id).map((conn) => ({
      id: conn.id,
      name: conn.name,
      environment: conn.environment,
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt,
    }));
    
    return NextResponse.json({
      success: true,
      data: allConnections,
    });
    
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

// POST - Create a new connection for the authenticated user
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { name, databaseUrl, environment } = body as {
      name: string;
      databaseUrl: string;
      environment: Environment;
    };
    
    // Validate input
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }
    
    if (!databaseUrl || typeof databaseUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Database URL is required' },
        { status: 400 }
      );
    }
    
    if (!environment || !['production', 'development'].includes(environment)) {
      return NextResponse.json(
        { success: false, error: 'Environment must be "production" or "development"' },
        { status: 400 }
      );
    }
    
    // Validate database URL format
    if (!validateDatabaseUrl(databaseUrl)) {
      return NextResponse.json(
        { success: false, error: 'Invalid PostgreSQL connection URL' },
        { status: 400 }
      );
    }
    
    // Test the connection
    const connectionTest = await testConnection(databaseUrl);
    
    if (!connectionTest.success) {
      return NextResponse.json(
        { success: false, error: `Connection failed: ${connectionTest.error}` },
        { status: 400 }
      );
    }
    
    // Get syncable tables
    const tables = await getSyncableTables(databaseUrl);
    
    // Encrypt the database URL
    const encryptedUrl = encrypt(databaseUrl);
    
    // Create the connection with user ID
    const connection = connectionStore.create(user.id, {
      name,
      encryptedUrl,
      environment,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        id: connection.id,
        name: connection.name,
        environment: connection.environment,
        maskedUrl: maskDatabaseUrl(databaseUrl),
        version: connectionTest.version,
        syncableTables: tables,
      },
    });
    
  } catch (error) {
    console.error('Error creating connection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create connection' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a connection for the authenticated user
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Connection ID is required' },
        { status: 400 }
      );
    }
    
    const deleted = connectionStore.delete(id, user.id);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Connection not found or access denied' },
        { status: 404 }
      );
    }
    
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

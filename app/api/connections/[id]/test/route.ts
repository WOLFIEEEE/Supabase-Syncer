import { NextRequest, NextResponse } from 'next/server';
import { connectionStore } from '@/lib/db/memory-store';
import { decrypt } from '@/lib/services/encryption';
import { testConnection } from '@/lib/services/drizzle-factory';
import { getUser } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/connections/[id]/test
 * 
 * Tests connectivity to a database connection and returns:
 * - Connection status (connected/failed)
 * - PostgreSQL version
 * - Number of tables
 * - Response time
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  
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
    const connection = connectionStore.getById(id, user.id);
    
    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    // Decrypt database URL
    const databaseUrl = decrypt(connection.encryptedUrl);
    
    // Test connection
    const result = await testConnection(databaseUrl);
    
    const responseTime = Date.now() - startTime;
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          status: 'connected',
          version: result.version,
          tableCount: result.tableCount,
          responseTime: `${responseTime}ms`,
          testedAt: new Date().toISOString(),
        },
      });
    } else {
      return NextResponse.json({
        success: false,
        data: {
          status: 'failed',
          error: result.error,
          responseTime: `${responseTime}ms`,
          testedAt: new Date().toISOString(),
        },
      });
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Connection test error:', error);
    return NextResponse.json({
      success: false,
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: `${responseTime}ms`,
        testedAt: new Date().toISOString(),
      },
    });
  }
}

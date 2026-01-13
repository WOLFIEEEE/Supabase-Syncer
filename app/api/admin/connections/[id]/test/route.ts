/**
 * POST /api/admin/connections/[id]/test
 * 
 * Test connection health (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { testConnection } from '@/lib/services/drizzle-factory';
import { decrypt } from '@/lib/services/encryption';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { id } = await params;
    const connection = await supabaseConnectionStore.getByIdForService(id);
    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Decrypt and test connection
    try {
      const decryptedUrl = decrypt(connection.encrypted_url);
      const testResult = await testConnection(decryptedUrl);

      if (testResult.success) {
        return NextResponse.json({
          success: true,
          data: {
            healthy: true,
            version: testResult.version,
            tableCount: testResult.tableCount,
          },
        });
      } else {
        return NextResponse.json({
          success: true,
          data: {
            healthy: false,
            error: testResult.error,
          },
        });
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      });
    }
  } catch (error) {
    console.error('[ADMIN_CONNECTIONS] Error testing connection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test connection' },
      { status: 500 }
    );
  }
}

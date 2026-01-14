/**
 * POST /api/admin/connections/[id]/keep-alive
 * 
 * Ping connection for keep-alive (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { logSecurityEvent } from '@/lib/services/security-logger';
import { createClient } from '@/lib/supabase/server';

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

    // Forward to backend keep-alive endpoint
    const { createProxyPOST } = await import('@/lib/utils/proxy-handler');
    const proxyHandler = createProxyPOST(() => `/api/connections/${id}/keep-alive`);
    
    const modifiedRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({
        encryptedUrl: connection.encrypted_url,
      }),
    });
    
    const response = await proxyHandler(modifiedRequest);
    const result = await response.json();

    // Update last_pinged_at if ping was successful
    if (result.success && result.data?.alive) {
      try {
        await supabaseConnectionStore.updateLastPinged(id);
      } catch (error) {
        console.error('[ADMIN_CONNECTIONS] Failed to update last_pinged_at:', error);
        // Don't fail the request if update fails, but log it
      }
    }

    // Log admin action
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      logSecurityEvent({
        eventType: 'auth_success',
        severity: 'low',
        userId: user.id,
        endpoint: `/api/admin/connections/${id}/keep-alive`,
        method: 'POST',
        details: {
          action: 'ping_connection',
          connectionId: id,
          targetUserId: connection.user_id,
          connectionName: connection.name,
          success: result.success,
        },
      }).catch(() => {});
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ADMIN_CONNECTIONS] Error pinging connection:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to ping connection' 
      },
      { status: 500 }
    );
  }
}

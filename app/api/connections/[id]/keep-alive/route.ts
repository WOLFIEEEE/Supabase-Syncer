/**
 * Keep Alive Toggle API
 * 
 * Allows users to enable/disable the keep-alive feature for a connection.
 * Also allows manual pinging of a database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { validateCSRFProtection, createCSRFErrorResponse } from '@/lib/services/csrf-protection';

/**
 * GET /api/connections/[id]/keep-alive
 * 
 * Get keep-alive status for a connection
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    const connection = await supabaseConnectionStore.getById(id, user.id);
    
    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      keepAlive: connection.keep_alive === true,
      lastPingedAt: connection.last_pinged_at || null,
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/connections/[id]/keep-alive
 * 
 * Toggle keep-alive setting for a connection
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfValidation = await validateCSRFProtection(request);
    if (!csrfValidation.valid) {
      return createCSRFErrorResponse(csrfValidation.error || 'CSRF validation failed');
    }

    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const body = await request.json();
    const { keepAlive } = body;
    
    if (typeof keepAlive !== 'boolean') {
      return NextResponse.json(
        { error: 'keepAlive must be a boolean' },
        { status: 400 }
      );
    }
    
    const connection = await supabaseConnectionStore.updateKeepAlive(id, user.id, keepAlive);
    
    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      keepAlive: connection.keep_alive === true,
      message: keepAlive 
        ? 'Keep-alive enabled. Your database will be pinged daily at midnight UTC.'
        : 'Keep-alive disabled.',
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/connections/[id]/keep-alive
 * 
 * Manually ping the database.
 * Proxies to backend.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrfValidation = await validateCSRFProtection(request);
    if (!csrfValidation.valid) {
      return createCSRFErrorResponse(csrfValidation.error || 'CSRF validation failed');
    }

    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    // Get connection from Supabase
    const connection = await supabaseConnectionStore.getById(id, user.id);
    
    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    // Forward to backend with encrypted URL
    const { createProxyPOST } = await import('@/lib/utils/proxy-handler');
    const proxyHandler = createProxyPOST(() => `/api/connections/${id}/keep-alive`);
    
    const modifiedRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({
        encryptedUrl: connection.encrypted_url,
      }),
    });
    
    return proxyHandler(modifiedRequest);
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

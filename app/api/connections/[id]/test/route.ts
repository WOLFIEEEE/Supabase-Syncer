/**
 * POST /api/connections/[id]/test
 * 
 * Tests connectivity to a database connection.
 * Proxies to backend for actual connection testing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { getUser } from '@/lib/supabase/server';
import { createProxyPOST } from '@/lib/utils/proxy-handler';
import { validateCSRFProtection, createCSRFErrorResponse } from '@/lib/services/csrf-protection';
import { logger } from '@/lib/services/logger';

// Use proxy handler but first fetch connection to get encrypted URL
export const POST = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const csrfValidation = await validateCSRFProtection(request);
    if (!csrfValidation.valid) {
      return createCSRFErrorResponse(csrfValidation.error || 'CSRF validation failed');
    }

    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    // Get connection from Supabase (lightweight operation, stays in frontend)
    const connection = await supabaseConnectionStore.getById(id, user.id);
    
    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    // Forward to backend with encrypted URL
    const proxyHandler = createProxyPOST(() => `/api/connections/${id}/test`);
    
    // Create a new request with the encrypted URL in the body
    const body = await request.json().catch(() => ({}));
    const modifiedRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({
        ...body,
        encryptedUrl: connection.encrypted_url,
      }),
    });
    
    return proxyHandler(modifiedRequest);
    
  } catch (error) {
    logger.error('Connection test proxy error', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to proxy connection test' },
      { status: 500 }
    );
  }
};

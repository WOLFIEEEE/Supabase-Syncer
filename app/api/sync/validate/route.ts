/**
 * POST /api/sync/validate
 * 
 * Validates schema compatibility between source and target.
 * Proxies to backend for schema validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { getUser } from '@/lib/supabase/server';
import { createProxyPOST } from '@/lib/utils/proxy-handler';
import { validateCSRFProtection, createCSRFErrorResponse } from '@/lib/services/csrf-protection';
import { logger } from '@/lib/services/logger';

export const POST = async (request: NextRequest) => {
  try {
    // CSRF Protection
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
    
    const body = await request.json();
    const { sourceConnectionId, targetConnectionId } = body;
    
    if (!sourceConnectionId || !targetConnectionId) {
      return NextResponse.json(
        { success: false, error: 'Source and target connection IDs are required' },
        { status: 400 }
      );
    }
    
    // Get connections from Supabase
    const [sourceConnection, targetConnection] = await Promise.all([
      supabaseConnectionStore.getById(sourceConnectionId, user.id),
      supabaseConnectionStore.getById(targetConnectionId, user.id),
    ]);
    
    if (!sourceConnection || !targetConnection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    // Forward to backend with encrypted URLs
    const proxyHandler = createProxyPOST('/api/sync/validate');
    
    const modifiedRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({
        ...body,
        sourceEncryptedUrl: sourceConnection.encrypted_url,
        targetEncryptedUrl: targetConnection.encrypted_url,
      }),
    });
    
    return proxyHandler(modifiedRequest);
    
  } catch (error) {
    logger.error('Sync validate proxy error', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to proxy validation request' },
      { status: 500 }
    );
  }
};

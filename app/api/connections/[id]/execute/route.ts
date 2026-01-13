/**
 * POST /api/connections/[id]/execute
 * 
 * Executes SQL on a database connection.
 * Proxies to backend for SQL execution.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { getUser } from '@/lib/supabase/server';
import { createProxyPOST } from '@/lib/utils/proxy-handler';
import { validateCSRFProtection, createCSRFErrorResponse } from '@/lib/services/csrf-protection';

export const POST = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
    
    const { id } = await params;
    
    // Get connection from Supabase
    const connection = await supabaseConnectionStore.getById(id, user.id);
    
    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    // Get request body
    const body = await request.json();
    
    // Forward to backend with encrypted URL
    const proxyHandler = createProxyPOST((req) => `/api/connections/${id}/execute`);
    
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
    console.error('Execute SQL proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to proxy SQL execution' },
      { status: 500 }
    );
  }
};

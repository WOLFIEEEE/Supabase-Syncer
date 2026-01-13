/**
 * GET /api/explorer/[connectionId]/tables
 * 
 * Lists tables for a database connection.
 * Proxies to backend for table listing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { getUser } from '@/lib/supabase/server';
import { createProxyGET } from '@/lib/utils/proxy-handler';

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> }
) => {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { connectionId } = await params;
    
    // Get connection from Supabase
    const connection = await supabaseConnectionStore.getById(connectionId, user.id);
    
    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    if (!connection.encrypted_url) {
      return NextResponse.json(
        { success: false, error: 'Connection missing encrypted URL' },
        { status: 400 }
      );
    }
    
    // Forward to backend with encrypted URL in query params
    const proxyHandler = createProxyGET((req) => {
      const url = new URL(req.url);
      // Preserve existing query params
      const existingParams = url.search;
      // Add encryptedUrl to the path
      const separator = existingParams ? '&' : '?';
      return `/api/explorer/${connectionId}/tables${existingParams}${separator}encryptedUrl=${encodeURIComponent(connection.encrypted_url)}`;
    });
    
    return proxyHandler(request);
    
  } catch (error) {
    console.error('Explorer tables proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to proxy tables request' },
      { status: 500 }
    );
  }
};

/**
 * GET /api/explorer/[connectionId]/[table]/rows
 * 
 * Gets table rows for a database connection.
 * Proxies to backend for row fetching.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { getUser } from '@/lib/supabase/server';
import { createProxyGET } from '@/lib/utils/proxy-handler';

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ connectionId: string; table: string }> }
) => {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { connectionId, table } = await params;
    
    // Get connection from Supabase
    const connection = await supabaseConnectionStore.getById(connectionId, user.id);
    
    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }
    
    // Forward to backend with encrypted URL
    const url = new URL(request.url);
    url.searchParams.set('encryptedUrl', connection.encrypted_url);
    
    const proxyHandler = createProxyGET((req) => {
      const url = new URL(req.url);
      return `/api/explorer/${connectionId}/${table}/rows${url.search}`;
    });
    
    return proxyHandler(request);
    
  } catch (error) {
    console.error('Explorer rows proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to proxy rows request' },
      { status: 500 }
    );
  }
};

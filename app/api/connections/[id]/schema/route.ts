/**
 * GET /api/connections/[id]/schema
 * 
 * Gets database schema for a connection.
 * Proxies to backend for schema inspection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { getUser } from '@/lib/supabase/server';
import { createProxyGET } from '@/lib/utils/proxy-handler';

export const GET = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
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
    
    // Forward to backend with encrypted URL as query parameter
    const url = new URL(request.url);
    url.searchParams.set('encryptedUrl', connection.encrypted_url);
    
    const proxyHandler = createProxyGET((req) => {
      const url = new URL(req.url);
      return `/api/connections/${id}/schema${url.search}`;
    });
    
    return proxyHandler(request);
    
  } catch (error) {
    console.error('Schema proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to proxy schema request' },
      { status: 500 }
    );
  }
};

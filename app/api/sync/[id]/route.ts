/**
 * GET /api/sync/[id]
 * 
 * Get sync job status.
 * Proxies to backend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { createProxyGET } from '@/lib/utils/proxy-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  const { id } = await params;
  
  const proxyHandler = createProxyGET((req) => {
    const url = new URL(req.url);
    return `/api/sync/${id}${url.search}`;
  });
  
  return proxyHandler(request);
}

/**
 * GET /api/sync/[id]/stream
 * 
 * SSE stream for sync progress.
 * Proxies to backend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { createProxyStream } from '@/lib/utils/proxy-handler';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max (Vercel hobby plan limit)

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
  
  const proxyHandler = createProxyStream((req) => `/api/sync/${id}/stream`);
  
  return proxyHandler(request);
}


/**
 * GET /api/admin/sync-jobs
 * 
 * List all sync jobs with filters.
 * Proxies to backend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { createProxyGET } from '@/lib/utils/proxy-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getUser();
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  const proxyHandler = createProxyGET((req) => {
    const url = new URL(req.url);
    return `/api/admin/sync-jobs${url.search}`;
  });
  
  return proxyHandler(request);
}

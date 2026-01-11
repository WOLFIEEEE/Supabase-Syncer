/**
 * GET /api/admin/security-events
 * 
 * Get security events with filters.
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
    return `/api/admin/security-events${url.search}`;
  });
  
  return proxyHandler(request);
}

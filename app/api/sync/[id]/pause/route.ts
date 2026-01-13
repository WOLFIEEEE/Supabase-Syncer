/**
 * POST /api/sync/[id]/pause
 * 
 * Pause a running sync job.
 * Proxies to backend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { createProxyPOST } from '@/lib/utils/proxy-handler';
import { validateCSRFProtection, createCSRFErrorResponse } from '@/lib/services/csrf-protection';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  
  const proxyHandler = createProxyPOST((req) => `/api/sync/${id}/pause`);
  
  return proxyHandler(request);
}

/**
 * POST /api/admin/export
 * 
 * Export data in various formats.
 * Proxies to backend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { createProxyPOST } from '@/lib/utils/proxy-handler';
import { validateCSRFProtection, createCSRFErrorResponse } from '@/lib/services/csrf-protection';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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
  
  const proxyHandler = createProxyPOST('/api/admin/export');
  
  return proxyHandler(request);
}

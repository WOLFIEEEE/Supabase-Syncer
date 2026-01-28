/**
 * POST /api/admin/export
 *
 * Export data in various formats.
 * Proxies to backend.
 *
 * SECURITY: Requires admin authentication
 */

import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { createProxyPOST } from '@/lib/utils/proxy-handler';
import { validateCSRFProtection, createCSRFErrorResponse } from '@/lib/services/csrf-protection';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // CSRF Protection
  const csrfValidation = await validateCSRFProtection(request);
  if (!csrfValidation.valid) {
    return createCSRFErrorResponse(csrfValidation.error || 'CSRF validation failed');
  }

  // Require admin access
  const adminCheck = await requireAdmin(request);
  if (adminCheck) {
    return adminCheck;
  }

  const proxyHandler = createProxyPOST('/api/admin/export');

  return proxyHandler(request);
}

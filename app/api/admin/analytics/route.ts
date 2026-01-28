/**
 * GET /api/admin/analytics
 *
 * Get admin analytics data.
 * Proxies to backend.
 *
 * SECURITY: Requires admin authentication
 */

import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { createProxyGET } from '@/lib/utils/proxy-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Require admin access
  const adminCheck = await requireAdmin(request);
  if (adminCheck) {
    return adminCheck;
  }

  const proxyHandler = createProxyGET((req) => {
    const url = new URL(req.url);
    return `/api/admin/analytics${url.search}`;
  });

  return proxyHandler(request);
}

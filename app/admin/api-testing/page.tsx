/**
 * API Testing Page
 *
 * Comprehensive API testing dashboard for admin users
 *
 * SECURITY: This page requires admin authentication
 */

import { requireAdminAccess } from '@/lib/middleware/admin-auth';
import { logSecurityEvent } from '@/lib/services/security-logger';
import APITestingClient from './APITestingClient';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export default async function APITestingPage() {
  const requestId = `api_testing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Strict admin authentication check
  let adminUser;
  try {
    adminUser = await requireAdminAccess();

    // Log successful access
    logSecurityEvent({
      eventType: 'auth_success',
      severity: 'low',
      userId: adminUser.id,
      endpoint: '/admin/api-testing',
      method: 'GET',
      details: {
        reason: 'API testing page accessed',
        requestId
      },
      requestId
    }).catch(err => logger.error('Failed to log security event', { error: err instanceof Error ? err.message : 'Unknown error' }));

  } catch (error) {
    logSecurityEvent({
      eventType: 'permission_denied',
      severity: 'high',
      endpoint: '/admin/api-testing',
      method: 'GET',
      details: {
        reason: 'API testing page access denied',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      },
      requestId
    }).catch(err => logger.error('Failed to log security event', { error: err instanceof Error ? err.message : 'Unknown error' }));

    throw error;
  }

  return <APITestingClient adminUser={adminUser} requestId={requestId} />;
}

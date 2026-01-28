/**
 * Admin Dashboard Main Page
 *
 * Overview dashboard showing key metrics and recent activity
 *
 * SECURITY: This page requires admin authentication
 */

import { getUserStats, getSyncStats, getSecurityStats } from '@/lib/services/admin-analytics';
import { getLiveMetrics, getSystemStatus } from '@/lib/services/real-time-monitor';
import { requireAdminAccess } from '@/lib/middleware/admin-auth';
import { logSecurityEvent } from '@/lib/services/security-logger';
import AdminDashboardClient from './AdminDashboardClient';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const pageLoadStart = Date.now();
  const requestId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Strict admin authentication check
  let adminUser;
  try {
    adminUser = await requireAdminAccess();

    // Non-blocking log - don't await to prevent timeouts
    logSecurityEvent({
      eventType: 'auth_success',
      severity: 'low',
      userId: adminUser.id,
      endpoint: '/admin',
      method: 'GET',
      details: {
        reason: 'Admin dashboard page accessed',
        requestId
      },
      requestId
    }).catch(err => logger.error('Failed to log security event', { error: err instanceof Error ? err.message : 'Unknown error' }));

  } catch (error) {
    logger.error('Admin access check failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Non-blocking log - don't await to prevent timeouts
    logSecurityEvent({
      eventType: 'permission_denied',
      severity: 'high',
      endpoint: '/admin',
      method: 'GET',
      details: {
        reason: 'Admin page access denied',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      },
      requestId
    }).catch(err => logger.error('Failed to log security event', { error: err instanceof Error ? err.message : 'Unknown error' }));

    throw error;
  }

  // Fetch all dashboard data
  const dataFetchStart = Date.now();
  const [userStats, syncStats, securityStats, liveMetrics, systemStatus] = await Promise.all([
    getUserStats(),
    getSyncStats(),
    getSecurityStats(24),
    getLiveMetrics(),
    getSystemStatus()
  ]);

  const dataFetchDuration = Date.now() - dataFetchStart;
  const totalPageLoadDuration = Date.now() - pageLoadStart;

  logger.info('Dashboard data fetched', {
    requestId,
    dataFetchDurationMs: dataFetchDuration,
    totalPageLoadDurationMs: totalPageLoadDuration
  });

  return (
    <AdminDashboardClient
      userStats={userStats}
      syncStats={syncStats}
      securityStats={securityStats}
      liveMetrics={liveMetrics}
      systemStatus={systemStatus}
      adminUser={adminUser}
      requestId={requestId}
    />
  );
}

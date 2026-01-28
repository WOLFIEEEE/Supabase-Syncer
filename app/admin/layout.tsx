/**
 * Admin Layout
 *
 * Layout for admin dashboard with navigation sidebar
 *
 * SECURITY: This layout requires admin authentication
 */

import { requireAdminAccess } from '@/lib/middleware/admin-auth';
import { redirect } from 'next/navigation';
import { logSecurityEvent } from '@/lib/services/security-logger';
import AdminLayoutClient from './AdminLayoutClient';
import { logger } from '@/lib/services/logger';

export const metadata = {
  title: 'Suparbase - Admin Dashboard',
  description: 'Suparbase admin control center - monitoring, testing, and management dashboard'
};

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const layoutLoadStart = Date.now();
  const requestId = `layout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Check admin access
  let adminUser;
  try {
    adminUser = await requireAdminAccess();

    const layoutLoadDuration = Date.now() - layoutLoadStart;
    logger.info('Admin layout access granted', {
      requestId,
      durationMs: layoutLoadDuration
    });

    // Non-blocking log - don't await to prevent timeouts
    logSecurityEvent({
      eventType: 'auth_success',
      severity: 'low',
      userId: adminUser.id,
      endpoint: '/admin',
      method: 'GET',
      details: {
        reason: 'Admin layout accessed',
        requestId,
        duration: layoutLoadDuration
      },
      requestId
    }).catch(err => logger.error('Failed to log security event', { error: err instanceof Error ? err.message : 'Unknown error' }));

  } catch (error) {
    const layoutLoadDuration = Date.now() - layoutLoadStart;
    logger.error('Admin access check failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs: layoutLoadDuration
    });

    // Non-blocking log - don't await to prevent timeouts
    logSecurityEvent({
      eventType: 'permission_denied',
      severity: 'high',
      endpoint: '/admin',
      method: 'GET',
      details: {
        reason: 'Admin layout access denied',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        duration: layoutLoadDuration
      },
      requestId
    }).catch(err => logger.error('Failed to log security event', { error: err instanceof Error ? err.message : 'Unknown error' }));

    redirect('/login?error=admin_required');
  }

  return (
    <AdminLayoutClient adminUser={adminUser}>
      {children}
    </AdminLayoutClient>
  );
}

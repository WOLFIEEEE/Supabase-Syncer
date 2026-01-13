/**
 * Admin Connections Management Page
 * 
 * View and manage all user connections across the system
 */

import { requireAdminAccess } from '@/lib/middleware/admin-auth';
import { logSecurityEvent } from '@/lib/services/security-logger';
import ConnectionsManagementClient from './ConnectionsManagementClient';

export const dynamic = 'force-dynamic';

export default async function AdminConnectionsPage() {
  const pageLoadStart = Date.now();
  const requestId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('[ADMIN_CONNECTIONS_PAGE] Page load started:', {
    requestId,
    timestamp: new Date().toISOString(),
    path: '/admin/connections'
  });
  
  // Strict admin authentication check
  let adminUser;
  try {
    adminUser = await requireAdminAccess();
    
    logSecurityEvent({
      eventType: 'auth_success',
      severity: 'low',
      userId: adminUser.id,
      endpoint: '/admin/connections',
      method: 'GET',
      details: {
        reason: 'Admin connections page accessed',
        email: adminUser.email,
        requestId
      },
      requestId
    }).catch(err => console.error('[ADMIN_CONNECTIONS_PAGE] Failed to log security event:', err));
    
  } catch (error) {
    console.error('[ADMIN_CONNECTIONS_PAGE] Admin access check failed:', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    
    logSecurityEvent({
      eventType: 'permission_denied',
      severity: 'high',
      endpoint: '/admin/connections',
      method: 'GET',
      details: {
        reason: 'Admin connections page access denied',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      },
      requestId
    }).catch(err => console.error('[ADMIN_CONNECTIONS_PAGE] Failed to log security event:', err));
    
    throw error;
  }
  
  const totalPageLoadDuration = Date.now() - pageLoadStart;
  
  console.log('[ADMIN_CONNECTIONS_PAGE] Page load completed:', {
    requestId,
    userId: adminUser.id,
    userEmail: adminUser.email,
    totalPageLoadDuration: `${totalPageLoadDuration}ms`,
    timestamp: new Date().toISOString()
  });
  
  return (
    <ConnectionsManagementClient
      adminUser={adminUser}
      requestId={requestId}
    />
  );
}

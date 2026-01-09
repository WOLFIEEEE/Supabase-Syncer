/**
 * Admin Dashboard Main Page
 * 
 * Overview dashboard showing key metrics and recent activity
 * 
 * SECURITY: This page requires admin authentication with exact email match:
 * - kgpkhushwant1@gmail.com
 */

import { getUserStats, getSyncStats, getSecurityStats } from '@/lib/services/admin-analytics';
import { getLiveMetrics, getSystemStatus } from '@/lib/services/real-time-monitor';
import { requireAdminAccess, ADMIN_EMAIL } from '@/lib/middleware/admin-auth';
import { logSecurityEvent } from '@/lib/services/security-logger';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const pageLoadStart = Date.now();
  const requestId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('[ADMIN_PAGE] Admin dashboard page load started:', {
    requestId,
    timestamp: new Date().toISOString(),
    path: '/admin'
  });
  
  // Strict admin authentication check with detailed logging
  let adminUser;
  try {
    console.log('[ADMIN_PAGE] Verifying admin access...', {
      requestId,
      requiredEmail: ADMIN_EMAIL,
      timestamp: new Date().toISOString()
    });
    
    adminUser = await requireAdminAccess();
    
    console.log('[ADMIN_PAGE] Admin access verified:', {
      requestId,
      userId: adminUser.id,
      userEmail: adminUser.email,
      emailMatch: adminUser.email === ADMIN_EMAIL,
      timestamp: new Date().toISOString()
    });
    
    // Non-blocking log - don't await to prevent timeouts
    logSecurityEvent({
      eventType: 'auth_success',
      severity: 'low',
      userId: adminUser.id,
      endpoint: '/admin',
      method: 'GET',
      details: {
        reason: 'Admin dashboard page accessed',
        email: adminUser.email,
        requiredEmail: ADMIN_EMAIL,
        emailMatch: adminUser.email === ADMIN_EMAIL,
        requestId
      },
      requestId
    }).catch(err => console.error('[ADMIN_PAGE] Failed to log security event:', err));
    
    // Double-check email match (extra security layer)
    if (adminUser.email !== ADMIN_EMAIL) {
      console.error('[ADMIN_PAGE] CRITICAL: Email mismatch detected:', {
        requestId,
        providedEmail: adminUser.email,
        requiredEmail: ADMIN_EMAIL,
        timestamp: new Date().toISOString()
      });
      
      // Non-blocking log - don't await to prevent timeouts
      logSecurityEvent({
        eventType: 'permission_denied',
        severity: 'critical',
        userId: adminUser.id,
        endpoint: '/admin',
        method: 'GET',
        details: {
          reason: 'Email mismatch in admin page - security violation',
          providedEmail: adminUser.email,
          requiredEmail: ADMIN_EMAIL,
          requestId
        },
        requestId
      }).catch(err => console.error('[ADMIN_PAGE] Failed to log security event:', err));
      
      throw new Error('Access denied: Email does not match admin requirements');
    }
    
  } catch (error) {
    console.error('[ADMIN_PAGE] Admin access check failed:', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
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
    }).catch(err => console.error('[ADMIN_PAGE] Failed to log security event:', err));
    
    throw error;
  }
  
  console.log('[ADMIN_PAGE] Fetching dashboard data...', {
    requestId,
    userId: adminUser.id,
    timestamp: new Date().toISOString()
  });
  
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
  
  console.log('[ADMIN_PAGE] Dashboard data fetched successfully:', {
    requestId,
    userId: adminUser.id,
    userEmail: adminUser.email,
    dataFetchDuration: `${dataFetchDuration}ms`,
    totalPageLoadDuration: `${totalPageLoadDuration}ms`,
    timestamp: new Date().toISOString()
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


/**
 * Admin Layout
 * 
 * Layout for admin dashboard with navigation sidebar
 * 
 * SECURITY: This layout requires admin authentication with exact email match:
 * - kgpkhushwant1@gmail.com
 */

import { requireAdminAccess, ADMIN_EMAIL } from '@/lib/middleware/admin-auth';
import { redirect } from 'next/navigation';
import { logSecurityEvent } from '@/lib/services/security-logger';
import AdminLayoutClient from './AdminLayoutClient';

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
  
  console.log('[ADMIN_LAYOUT] Admin layout load started:', {
    requestId,
    timestamp: new Date().toISOString(),
    path: '/admin'
  });
  
  // Check admin access with detailed logging
  let adminUser;
  try {
    console.log('[ADMIN_LAYOUT] Verifying admin access...', {
      requestId,
      requiredEmail: ADMIN_EMAIL,
      timestamp: new Date().toISOString()
    });
    
    adminUser = await requireAdminAccess();
    
    console.log('[ADMIN_LAYOUT] Admin access verified:', {
      requestId,
      userId: adminUser.id,
      userEmail: adminUser.email,
      emailMatch: adminUser.email === ADMIN_EMAIL,
      timestamp: new Date().toISOString()
    });
    
    // Double-check email match (extra security layer)
    if (adminUser.email !== ADMIN_EMAIL) {
      console.error('[ADMIN_LAYOUT] CRITICAL: Email mismatch detected:', {
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
          reason: 'Email mismatch in admin layout - security violation',
          providedEmail: adminUser.email,
          requiredEmail: ADMIN_EMAIL,
          requestId
        },
        requestId
      }).catch(err => console.error('[ADMIN_LAYOUT] Failed to log security event:', err));
      
      redirect('/login?error=admin_required');
    }
    
    const layoutLoadDuration = Date.now() - layoutLoadStart;
    console.log('[ADMIN_LAYOUT] Admin layout access granted:', {
      requestId,
      userId: adminUser.id,
      userEmail: adminUser.email,
      duration: `${layoutLoadDuration}ms`,
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
        reason: 'Admin layout accessed',
        email: adminUser.email,
        requiredEmail: ADMIN_EMAIL,
        emailMatch: adminUser.email === ADMIN_EMAIL,
        requestId,
        duration: layoutLoadDuration
      },
      requestId
    }).catch(err => console.error('[ADMIN_LAYOUT] Failed to log security event:', err));
    
  } catch (error) {
    const layoutLoadDuration = Date.now() - layoutLoadStart;
    console.error('[ADMIN_LAYOUT] Admin access check failed:', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${layoutLoadDuration}ms`,
      timestamp: new Date().toISOString()
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
    }).catch(err => console.error('[ADMIN_LAYOUT] Failed to log security event:', err));
    
    redirect('/login?error=admin_required');
  }
  
  return (
    <AdminLayoutClient adminUser={adminUser}>
      {children}
    </AdminLayoutClient>
  );
}


/**
 * API Testing Page
 * 
 * Comprehensive API testing dashboard for admin users
 * 
 * SECURITY: This page requires admin authentication with exact email match
 */

import { requireAdminAccess, ADMIN_EMAIL } from '@/lib/middleware/admin-auth';
import { logSecurityEvent } from '@/lib/services/security-logger';
import APITestingClient from './APITestingClient';

export const dynamic = 'force-dynamic';

export default async function APITestingPage() {
  const requestId = `api_testing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Strict admin authentication check
  let adminUser;
  try {
    adminUser = await requireAdminAccess();
    
    // Double-check email match
    if (adminUser.email !== ADMIN_EMAIL) {
      logSecurityEvent({
        eventType: 'permission_denied',
        severity: 'critical',
        userId: adminUser.id,
        endpoint: '/admin/api-testing',
        method: 'GET',
        details: {
          reason: 'Email mismatch in API testing page',
          providedEmail: adminUser.email,
          requiredEmail: ADMIN_EMAIL,
          requestId
        },
        requestId
      }).catch(console.error);
      
      throw new Error('Access denied: Email does not match admin requirements');
    }
    
    // Log successful access
    logSecurityEvent({
      eventType: 'auth_success',
      severity: 'low',
      userId: adminUser.id,
      endpoint: '/admin/api-testing',
      method: 'GET',
      details: {
        reason: 'API testing page accessed',
        email: adminUser.email,
        requestId
      },
      requestId
    }).catch(console.error);
    
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
    }).catch(console.error);
    
    throw error;
  }
  
  return <APITestingClient adminUser={adminUser} requestId={requestId} />;
}

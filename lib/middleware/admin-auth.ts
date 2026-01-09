/**
 * Admin Authentication Middleware
 * 
 * Provides authentication and authorization for admin-only routes.
 * Ensures only the designated admin email can access admin functionality.
 * 
 * SECURITY REQUIREMENTS:
 * - User must be authenticated (logged in)
 * - User email must EXACTLY match: kgpkhushwant1@gmail.com
 * - Email comparison is case-insensitive but trimmed
 * - All access attempts are logged with detailed information
 * 
 * LOGGING:
 * - All authentication checks are logged to console with [ADMIN_AUTH] prefix
 * - Security events are logged via logSecurityEvent()
 * - Includes request IDs, timestamps, user info, and duration metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logSecurityEvent } from '@/lib/services/security-logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Admin email address - must match exactly (case-insensitive)
 * Can be overridden via ADMIN_EMAIL environment variable
 * Default: kgpkhushwant1@gmail.com
 */
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'kgpkhushwant1@gmail.com';

console.log('[ADMIN_AUTH] Admin authentication initialized:', {
  adminEmail: ADMIN_EMAIL,
  source: process.env.ADMIN_EMAIL ? 'environment variable' : 'default',
  timestamp: new Date().toISOString()
});

// ============================================================================
// TYPES
// ============================================================================

export interface AdminUser {
  id: string;
  email: string;
  isAdmin: true;
}

export interface AdminAuthResult {
  isAdmin: boolean;
  user?: AdminUser;
  error?: string;
}

// ============================================================================
// ADMIN CHECK FUNCTIONS
// ============================================================================

/**
 * Check if an email is the admin email
 * Logs detailed information about the check
 */
export function isAdmin(email: string | null | undefined): boolean {
  console.log('[ADMIN_AUTH] Checking admin status for email:', {
    providedEmail: email || 'null/undefined',
    adminEmail: ADMIN_EMAIL,
    timestamp: new Date().toISOString()
  });
  
  if (!email) {
    console.log('[ADMIN_AUTH] Email check failed: No email provided');
    return false;
  }
  
  const normalizedProvided = email.toLowerCase().trim();
  const normalizedAdmin = ADMIN_EMAIL.toLowerCase().trim();
  const isMatch = normalizedProvided === normalizedAdmin;
  
  console.log('[ADMIN_AUTH] Email comparison result:', {
    providedEmail: email,
    normalizedProvided,
    normalizedAdmin,
    isMatch,
    exactMatch: email === ADMIN_EMAIL,
    timestamp: new Date().toISOString()
  });
  
  return isMatch;
}

/**
 * Get admin user from request
 * Includes detailed logging for all authentication steps
 */
export async function getAdminUser(request: NextRequest): Promise<AdminAuthResult> {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('[ADMIN_AUTH] Starting admin user check:', {
    requestId,
    path: request.nextUrl.pathname,
    method: request.method,
    ip: getClientIP(request),
    userAgent: getUserAgent(request),
    timestamp: new Date().toISOString()
  });
  
  try {
    console.log('[ADMIN_AUTH] Creating Supabase client...', { requestId });
    const supabase = await createClient();
    
    console.log('[ADMIN_AUTH] Fetching user from Supabase...', { requestId });
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('[ADMIN_AUTH] Supabase auth error:', {
        requestId,
        error: error.message,
        errorCode: error.status,
        timestamp: new Date().toISOString()
      });
      
      await logSecurityEvent({
        eventType: 'auth_failed',
        severity: 'medium',
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        endpoint: request.nextUrl.pathname,
        method: request.method,
        details: {
          reason: 'Supabase auth error',
          error: error.message,
          errorCode: error.status,
          requestId
        },
        requestId
      });
      
      return {
        isAdmin: false,
        error: 'Not authenticated'
      };
    }
    
    if (!user) {
      console.warn('[ADMIN_AUTH] No user found in session:', {
        requestId,
        ip: getClientIP(request),
        timestamp: new Date().toISOString()
      });
      
      await logSecurityEvent({
        eventType: 'auth_failed',
        severity: 'medium',
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        endpoint: request.nextUrl.pathname,
        method: request.method,
        details: {
          reason: 'No user in session',
          requestId
        },
        requestId
      });
      
      return {
        isAdmin: false,
        error: 'Not authenticated'
      };
    }
    
    console.log('[ADMIN_AUTH] User found in session:', {
      requestId,
      userId: user.id,
      userEmail: user.email,
      emailVerified: user.email_confirmed_at ? true : false,
      timestamp: new Date().toISOString()
    });
    
    // Strict email check - must match exactly
    const emailCheckResult = isAdmin(user.email);
    
    if (!emailCheckResult) {
      console.warn('[ADMIN_AUTH] Admin access denied - email mismatch:', {
        requestId,
        userId: user.id,
        providedEmail: user.email,
        requiredEmail: ADMIN_EMAIL,
        timestamp: new Date().toISOString()
      });
      
      // Log unauthorized admin access attempt
      await logSecurityEvent({
        eventType: 'permission_denied',
        severity: 'high',
        userId: user.id,
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request),
        endpoint: request.nextUrl.pathname,
        method: request.method,
        details: {
          reason: 'User email does not match admin email',
          providedEmail: user.email,
          requiredEmail: ADMIN_EMAIL,
          attemptedPath: request.nextUrl.pathname,
          requestId
        },
        requestId
      });
      
      return {
        isAdmin: false,
        error: 'Insufficient permissions'
      };
    }
    
    const duration = Date.now() - startTime;
    console.log('[ADMIN_AUTH] Admin access granted:', {
      requestId,
      userId: user.id,
      userEmail: user.email,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    await logSecurityEvent({
      eventType: 'auth_success',
      severity: 'low',
      userId: user.id,
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
      endpoint: request.nextUrl.pathname,
      method: request.method,
      details: {
        reason: 'Admin access granted',
        email: user.email,
        requestId,
        duration
      },
      requestId
    });
    
    return {
      isAdmin: true,
      user: {
        id: user.id,
        email: user.email!,
        isAdmin: true
      }
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ADMIN_AUTH] Error checking admin auth:', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    await logSecurityEvent({
      eventType: 'api_error',
      severity: 'high',
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
      endpoint: request.nextUrl.pathname,
      method: request.method,
      details: {
        reason: 'Admin auth check failed with exception',
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        duration
      },
      requestId
    });
    
    return {
      isAdmin: false,
      error: 'Authentication check failed'
    };
  }
}

/**
 * Middleware to require admin access
 * Returns NextResponse with error if not admin, otherwise returns null
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const authResult = await getAdminUser(request);
  
  if (!authResult.isAdmin) {
    // For API routes, return JSON error
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { 
          success: false, 
          error: authResult.error || 'Admin access required',
          code: 'ADMIN_REQUIRED'
        },
        { status: 403 }
      );
    }
    
    // For page routes, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    loginUrl.searchParams.set('error', 'admin_required');
    return NextResponse.redirect(loginUrl);
  }
  
  // Admin authenticated, allow request
  return null;
}

/**
 * Check if user is admin (for use in server components)
 * Includes detailed logging
 */
export async function checkAdminAccess(): Promise<AdminAuthResult> {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('[ADMIN_AUTH] Checking admin access (server component):', {
    requestId,
    timestamp: new Date().toISOString()
  });
  
  try {
    console.log('[ADMIN_AUTH] Creating Supabase client (server component)...', { requestId });
    const supabase = await createClient();
    
    console.log('[ADMIN_AUTH] Fetching user from Supabase (server component)...', { requestId });
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('[ADMIN_AUTH] Supabase auth error (server component):', {
        requestId,
        error: error.message,
        errorCode: error.status,
        timestamp: new Date().toISOString()
      });
      
      return {
        isAdmin: false,
        error: 'Not authenticated'
      };
    }
    
    if (!user) {
      console.warn('[ADMIN_AUTH] No user found in session (server component):', {
        requestId,
        timestamp: new Date().toISOString()
      });
      
      return {
        isAdmin: false,
        error: 'Not authenticated'
      };
    }
    
    console.log('[ADMIN_AUTH] User found in session (server component):', {
      requestId,
      userId: user.id,
      userEmail: user.email,
      emailVerified: user.email_confirmed_at ? true : false,
      timestamp: new Date().toISOString()
    });
    
    // Strict email check - must match exactly
    const emailCheckResult = isAdmin(user.email);
    
    if (!emailCheckResult) {
      console.warn('[ADMIN_AUTH] Admin access denied - email mismatch (server component):', {
        requestId,
        userId: user.id,
        providedEmail: user.email,
        requiredEmail: ADMIN_EMAIL,
        timestamp: new Date().toISOString()
      });
      
      return {
        isAdmin: false,
        error: 'Insufficient permissions'
      };
    }
    
    const duration = Date.now() - startTime;
    console.log('[ADMIN_AUTH] Admin access granted (server component):', {
      requestId,
      userId: user.id,
      userEmail: user.email,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return {
      isAdmin: true,
      user: {
        id: user.id,
        email: user.email!,
        isAdmin: true
      }
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[ADMIN_AUTH] Error checking admin access (server component):', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    return {
      isAdmin: false,
      error: 'Authentication check failed'
    };
  }
}

/**
 * Require admin access in server components
 * Throws error if not admin
 * Includes detailed logging
 */
export async function requireAdminAccess(): Promise<AdminUser> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('[ADMIN_AUTH] Requiring admin access:', {
    requestId,
    timestamp: new Date().toISOString()
  });
  
  const result = await checkAdminAccess();
  
  if (!result.isAdmin || !result.user) {
    console.error('[ADMIN_AUTH] Admin access requirement failed:', {
      requestId,
      error: result.error,
      timestamp: new Date().toISOString()
    });
    
    throw new Error(result.error || 'Admin access required');
  }
  
  console.log('[ADMIN_AUTH] Admin access requirement satisfied:', {
    requestId,
    userId: result.user.id,
    userEmail: result.user.email,
    timestamp: new Date().toISOString()
  });
  
  return result.user;
}

/**
 * Get current admin user or null
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const result = await checkAdminAccess();
  return result.isAdmin && result.user ? result.user : null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string | undefined {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // NextRequest doesn't have .ip property, return undefined if no header found
  return undefined;
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: NextRequest): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

/**
 * Extract device info from user agent
 */
export function parseUserAgent(userAgent: string | undefined): {
  browser?: string;
  os?: string;
  device?: string;
} {
  if (!userAgent) return {};
  
  const result: {
    browser?: string;
    os?: string;
    device?: string;
  } = {};
  
  // Browser detection
  if (userAgent.includes('Chrome')) result.browser = 'Chrome';
  else if (userAgent.includes('Firefox')) result.browser = 'Firefox';
  else if (userAgent.includes('Safari')) result.browser = 'Safari';
  else if (userAgent.includes('Edge')) result.browser = 'Edge';
  
  // OS detection
  if (userAgent.includes('Windows')) result.os = 'Windows';
  else if (userAgent.includes('Mac OS')) result.os = 'macOS';
  else if (userAgent.includes('Linux')) result.os = 'Linux';
  else if (userAgent.includes('Android')) result.os = 'Android';
  else if (userAgent.includes('iOS')) result.os = 'iOS';
  
  // Device detection
  if (userAgent.includes('Mobile')) result.device = 'Mobile';
  else if (userAgent.includes('Tablet')) result.device = 'Tablet';
  else result.device = 'Desktop';
  
  return result;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { ADMIN_EMAIL };


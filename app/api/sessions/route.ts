/**
 * Session Management API
 * 
 * GET /api/sessions - Get all active sessions for the current user
 * DELETE /api/sessions - Sign out from all devices
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { getUserSessions, signOutAllDevices } from '@/lib/services/session-security';
import { validateCSRFProtection, createCSRFErrorResponse } from '@/lib/services/csrf-protection';
import { checkDistributedRateLimit, createDistributedRateLimitHeaders } from '@/lib/services/rate-limiter-redis';
import { sanitizeErrorMessage } from '@/lib/services/security-utils';

/**
 * GET /api/sessions
 * Get all active sessions for the authenticated user
 */
export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Rate limit check
    const rateLimitResult = await checkDistributedRateLimit(user.id, 'read');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please slow down.' },
        { status: 429, headers: createDistributedRateLimitHeaders(rateLimitResult, 'read') }
      );
    }
    
    const sessions = await getUserSessions(user.id);
    
    // Sanitize session data for client
    const sanitizedSessions = sessions.map(session => ({
      id: session.id,
      lastActivity: session.lastActivity.toISOString(),
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      deviceInfo: session.deviceInfo,
      // Mask IP for privacy (show only first part)
      ipAddress: session.ipAddress ? maskIP(session.ipAddress) : null,
    }));
    
    return NextResponse.json({
      success: true,
      sessions: sanitizedSessions,
      count: sanitizedSessions.length,
    });
  } catch (error) {
    console.error('Failed to get sessions:', error);
    
    return NextResponse.json(
      { success: false, error: sanitizeErrorMessage((error as Error).message) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sessions
 * Sign out from all devices (optionally keep current session)
 */
export async function DELETE(request: NextRequest) {
  try {
    // CSRF Protection
    const csrfValidation = await validateCSRFProtection(request);
    if (!csrfValidation.valid) {
      return createCSRFErrorResponse(csrfValidation.error || 'CSRF validation failed');
    }
    
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Rate limit check for write operations
    const rateLimitResult = await checkDistributedRateLimit(user.id, 'write');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please slow down.' },
        { status: 429, headers: createDistributedRateLimitHeaders(rateLimitResult, 'write') }
      );
    }
    
    // Parse request body for optional current session token
    let currentSessionToken: string | undefined;
    try {
      const body = await request.json();
      currentSessionToken = body.keepCurrentSession ? body.currentSessionToken : undefined;
    } catch {
      // No body or invalid JSON, sign out all sessions
    }
    
    const result = await signOutAllDevices(user.id, currentSessionToken);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to sign out from all devices' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Signed out from ${result.sessionsRevoked} device(s)`,
      sessionsRevoked: result.sessionsRevoked,
    });
  } catch (error) {
    console.error('Failed to sign out all devices:', error);
    
    return NextResponse.json(
      { success: false, error: sanitizeErrorMessage((error as Error).message) },
      { status: 500 }
    );
  }
}

/**
 * Mask IP address for privacy
 */
function maskIP(ip: string): string {
  // IPv4: show only first two octets
  if (ip.includes('.')) {
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.*.*`;
  }
  
  // IPv6: show only first four groups
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts.slice(0, 4).join(':')}:****`;
  }
  
  return '***';
}


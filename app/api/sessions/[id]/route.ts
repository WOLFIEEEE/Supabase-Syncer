/**
 * Individual Session Management API
 * 
 * DELETE /api/sessions/[id] - Sign out from a specific session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { signOutSession } from '@/lib/services/session-security';
import { validateCSRFProtection, createCSRFErrorResponse } from '@/lib/services/csrf-protection';
import { checkDistributedRateLimit, createDistributedRateLimitHeaders } from '@/lib/services/rate-limiter-redis';
import { sanitizeErrorMessage, isValidUUID } from '@/lib/services/security-utils';
import { logger } from '@/lib/services/logger';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * DELETE /api/sessions/[id]
 * Sign out from a specific session
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
    
    const { id: sessionId } = await params;
    
    // Validate session ID format
    if (!isValidUUID(sessionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID format' },
        { status: 400 }
      );
    }
    
    // Rate limit check
    const rateLimitResult = await checkDistributedRateLimit(user.id, 'write');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please slow down.' },
        { status: 429, headers: createDistributedRateLimitHeaders(rateLimitResult, 'write') }
      );
    }
    
    const success = await signOutSession(user.id, sessionId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Session not found or already signed out' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Session signed out successfully',
    });
  } catch (error) {
    logger.error('Failed to sign out session', { error });

    return NextResponse.json(
      { success: false, error: sanitizeErrorMessage((error as Error).message) },
      { status: 500 }
    );
  }
}


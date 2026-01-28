/**
 * POST /api/admin/users/[id]/logout
 * 
 * Force logout a user (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { forceLogout } from '@/lib/services/admin-user-actions';
import { logSecurityEvent } from '@/lib/services/security-logger';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/services/logger';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { id } = await params;
    const success = await forceLogout(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to force logout' },
        { status: 500 }
      );
    }

    // Log admin action
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      logSecurityEvent({
        eventType: 'session_revoked',
        severity: 'medium',
        userId: user.id,
        endpoint: `/api/admin/users/${id}/logout`,
        method: 'POST',
        details: {
          action: 'force_logout',
          targetUserId: id,
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: 'User logged out successfully',
    });
  } catch (error) {
    logger.error('[ADMIN_USERS] Error forcing logout', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to force logout' },
      { status: 500 }
    );
  }
}

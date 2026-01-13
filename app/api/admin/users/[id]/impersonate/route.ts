/**
 * POST /api/admin/users/[id]/impersonate
 * 
 * Create impersonation token for a user (admin only)
 * Note: Actual impersonation would require additional frontend implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { createImpersonationToken } from '@/lib/services/admin-user-actions';
import { logSecurityEvent } from '@/lib/services/security-logger';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { id } = await params;
    const token = await createImpersonationToken(id);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Failed to create impersonation token' },
        { status: 500 }
      );
    }

    // Log admin action (critical - impersonation is sensitive)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      logSecurityEvent({
        eventType: 'suspicious_activity',
        severity: 'critical',
        userId: user.id,
        endpoint: `/api/admin/users/${id}/impersonate`,
        method: 'POST',
        details: {
          action: 'impersonate_user',
          targetUserId: id,
          impersonationToken: token.substring(0, 20) + '...', // Partial token for logging
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: id,
        token,
        // In production, you'd want to return a secure URL or handle this differently
        note: 'This token can be used for impersonation. Store securely.',
      },
    });
  } catch (error) {
    console.error('[ADMIN_USERS] Error creating impersonation token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create impersonation token' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users/[id]/ban
 * 
 * Ban or unban a user (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { banUser } from '@/lib/services/admin-user-actions';
import { logSecurityEvent } from '@/lib/services/security-logger';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const body = await request.json();
    const { banned, reason } = body;

    if (typeof banned !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'banned field must be a boolean' },
        { status: 400 }
      );
    }

    const result = await banUser(params.id, banned, reason);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update ban status' },
        { status: 500 }
      );
    }

    // Log admin action
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      logSecurityEvent({
        eventType: banned ? 'suspicious_activity' : 'auth_success',
        severity: banned ? 'high' : 'low',
        userId: user.id,
        endpoint: `/api/admin/users/${params.id}/ban`,
        method: 'POST',
        details: {
          action: banned ? 'ban_user' : 'unban_user',
          targetUserId: params.id,
          reason: reason || 'No reason provided',
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: params.id,
        banned: result.banned,
      },
    });
  } catch (error) {
    console.error('[ADMIN_USERS] Error updating ban status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ban status' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/users/[id]
 * 
 * Get user details (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { getUserDetails } from '@/lib/services/admin-user-actions';
import { logSecurityEvent } from '@/lib/services/security-logger';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await requireAdmin(request);
    if (adminCheck) return adminCheck;

    const { id } = await params;
    const userDetails = await getUserDetails(id);

    if (!userDetails) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Log admin action
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      logSecurityEvent({
        eventType: 'auth_success',
        severity: 'low',
        userId: user.id,
        endpoint: `/api/admin/users/${id}`,
        method: 'GET',
        details: {
          action: 'view_user_details',
          targetUserId: id,
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: userDetails,
    });
  } catch (error) {
    console.error('[ADMIN_USERS] Error fetching user details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}

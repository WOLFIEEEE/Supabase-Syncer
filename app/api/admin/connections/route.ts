/**
 * GET /api/admin/connections
 * 
 * List all connections across all users (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { logSecurityEvent } from '@/lib/services/security-logger';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    const adminCheck = await requireAdmin(request);
    if (adminCheck) {
      return adminCheck;
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const environment = searchParams.get('environment') || '';
    const keepAlive = searchParams.get('keepAlive') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get all connections (admin can see all)
    const allConnections = await supabaseConnectionStore.getAllForService();
    const supabase = await createClient();

    // Get user emails for display
    const userIds = [...new Set(allConnections.map(c => c.user_id))];
    const userMap = new Map<string, string>();
    
    if (userIds.length > 0) {
      // Fetch user emails from auth.users (via Supabase admin API or from sessions)
      // For now, we'll use user_id as identifier
      // In production, you might want to create a users view or use Supabase admin API
    }

    // Apply filters
    let filtered = allConnections;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.user_id.toLowerCase().includes(searchLower)
      );
    }

    if (environment) {
      filtered = filtered.filter(c => c.environment === environment);
    }

    if (keepAlive === 'true') {
      filtered = filtered.filter(c => c.keep_alive === true);
    } else if (keepAlive === 'false') {
      filtered = filtered.filter(c => !c.keep_alive);
    }

    // Sort by created_at descending
    filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Paginate
    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    // Format response
    const connections = paginated.map(conn => ({
      id: conn.id,
      userId: conn.user_id,
      name: conn.name,
      environment: conn.environment,
      keepAlive: conn.keep_alive || false,
      lastPingedAt: conn.last_pinged_at,
      createdAt: conn.created_at,
      updatedAt: conn.updated_at,
    }));

    // Log admin action
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      logSecurityEvent({
        eventType: 'auth_success',
        severity: 'low',
        userId: user.id,
        endpoint: '/api/admin/connections',
        method: 'GET',
        details: {
          action: 'list_all_connections',
          total: total,
          filtered: filtered.length,
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: connections,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('[ADMIN_CONNECTIONS] Error listing connections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

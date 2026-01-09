/**
 * Admin Users API
 * 
 * GET /api/admin/users - List all users with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/middleware/admin-auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    await requireAdminAccess();
    
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Get unique users from connections and sessions
    const [connectionsResult, sessionsResult] = await Promise.all([
      supabase.from('connections').select('user_id, created_at').order('created_at', { ascending: false }),
      supabase.from('user_sessions').select('user_id, created_at, last_activity').order('last_activity', { ascending: false }),
    ]);
    
    const userMap = new Map<string, {
      userId: string;
      firstSeen: Date;
      lastActivity?: Date;
      connectionCount: number;
      sessionCount: number;
    }>();
    
    // Process connections
    if (connectionsResult.data) {
      connectionsResult.data.forEach((conn: { user_id: string; created_at: string }) => {
        const existing = userMap.get(conn.user_id) || {
          userId: conn.user_id,
          firstSeen: new Date(conn.created_at),
          connectionCount: 0,
          sessionCount: 0,
        };
        existing.connectionCount++;
        const connDate = new Date(conn.created_at);
        if (connDate < existing.firstSeen) {
          existing.firstSeen = connDate;
        }
        userMap.set(conn.user_id, existing);
      });
    }
    
    // Process sessions
    if (sessionsResult.data) {
      sessionsResult.data.forEach((session: { user_id: string; created_at: string; last_activity: string }) => {
        const existing = userMap.get(session.user_id) || {
          userId: session.user_id,
          firstSeen: new Date(session.created_at),
          connectionCount: 0,
          sessionCount: 0,
        };
        existing.sessionCount++;
        const sessionDate = new Date(session.created_at);
        if (sessionDate < existing.firstSeen) {
          existing.firstSeen = sessionDate;
        }
        const lastActivity = new Date(session.last_activity);
        if (!existing.lastActivity || lastActivity > existing.lastActivity) {
          existing.lastActivity = lastActivity;
        }
        userMap.set(session.user_id, existing);
      });
    }
    
    // Convert to array and filter/search
    let users = Array.from(userMap.values());
    
    if (search) {
      users = users.filter(u => u.userId.toLowerCase().includes(search.toLowerCase()));
    }
    
    // Sort by last activity (most recent first)
    users.sort((a, b) => {
      if (!a.lastActivity && !b.lastActivity) return 0;
      if (!a.lastActivity) return 1;
      if (!b.lastActivity) return -1;
      return b.lastActivity.getTime() - a.lastActivity.getTime();
    });
    
    const total = users.length;
    const paginatedUsers = users.slice(offset, offset + limit);
    
    return NextResponse.json({
      success: true,
      data: paginatedUsers.map(u => ({
        userId: u.userId,
        firstSeen: u.firstSeen.toISOString(),
        lastActivity: u.lastActivity?.toISOString(),
        connectionCount: u.connectionCount,
        sessionCount: u.sessionCount,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('[ADMIN_API] Error getting users:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get users' },
      { status: 500 }
    );
  }
}


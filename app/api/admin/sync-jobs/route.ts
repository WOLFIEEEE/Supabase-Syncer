/**
 * Admin Sync Jobs API
 * 
 * GET /api/admin/sync-jobs - List all sync jobs with filters
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
    
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let query = supabase
      .from('sync_jobs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    const { data, error, count } = await query.range(offset, offset + limit - 1);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('[ADMIN_API] Error getting sync jobs:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get sync jobs' },
      { status: 500 }
    );
  }
}


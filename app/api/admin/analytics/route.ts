/**
 * Admin Analytics API
 * 
 * GET /api/admin/analytics - Get analytics data
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/middleware/admin-auth';
import {
  getUserGrowthData,
  getSyncPerformanceData,
  getAPIUsageData,
  getErrorTrends,
  getTopUsers,
  getTopConnections,
} from '@/lib/services/admin-analytics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Require admin access
    await requireAdminAccess();
    
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const type = searchParams.get('type');
    
    if (type === 'user-growth') {
      const data = await getUserGrowthData(days);
      return NextResponse.json({ success: true, data });
    }
    
    if (type === 'sync-performance') {
      const data = await getSyncPerformanceData(days);
      return NextResponse.json({ success: true, data });
    }
    
    if (type === 'api-usage') {
      const data = await getAPIUsageData(days);
      return NextResponse.json({ success: true, data });
    }
    
    if (type === 'error-trends') {
      const data = await getErrorTrends(days);
      return NextResponse.json({ success: true, data });
    }
    
    if (type === 'top-users') {
      const limit = parseInt(searchParams.get('limit') || '10');
      const data = await getTopUsers(limit);
      return NextResponse.json({ success: true, data });
    }
    
    if (type === 'top-connections') {
      const limit = parseInt(searchParams.get('limit') || '10');
      const data = await getTopConnections(limit);
      return NextResponse.json({ success: true, data });
    }
    
    // Return all analytics
    const [userGrowth, syncPerformance, apiUsage, errorTrends, topUsers, topConnections] = await Promise.all([
      getUserGrowthData(days),
      getSyncPerformanceData(days),
      getAPIUsageData(days),
      getErrorTrends(days),
      getTopUsers(10),
      getTopConnections(10),
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        userGrowth,
        syncPerformance,
        apiUsage,
        errorTrends,
        topUsers,
        topConnections,
      },
    });
  } catch (error) {
    console.error('[ADMIN_API] Error getting analytics:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get analytics' },
      { status: 500 }
    );
  }
}


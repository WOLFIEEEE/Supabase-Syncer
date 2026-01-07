import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { getUserUsageLimits } from '@/lib/services/usage-limits';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/services/rate-limiter';

// GET - Get current usage statistics for the authenticated user
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
    const rateLimitResult = checkRateLimit(user.id, 'read');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.` },
        { status: 429, headers: createRateLimitHeaders(rateLimitResult, 'read') }
      );
    }
    
    const usage = await getUserUsageLimits(user.id);
    
    // Calculate percentages
    const connectionsPercentage = (usage.currentConnections / usage.maxConnections) * 100;
    const syncJobsPercentage = (usage.currentSyncJobsThisMonth / usage.maxSyncJobsPerMonth) * 100;
    const dataTransferPercentage = (usage.currentDataTransferMbThisMonth / usage.maxDataTransferMbPerMonth) * 100;
    
    // Determine if any limits are approaching
    const warnings = [];
    if (connectionsPercentage >= 80) {
      warnings.push('connections');
    }
    if (syncJobsPercentage >= 80) {
      warnings.push('sync_jobs');
    }
    if (dataTransferPercentage >= 80) {
      warnings.push('data_transfer');
    }
    
    return NextResponse.json({
      success: true,
      data: {
        usage: {
          connections: {
            current: usage.currentConnections,
            limit: usage.maxConnections,
            percentage: Math.round(connectionsPercentage),
          },
          syncJobs: {
            current: usage.currentSyncJobsThisMonth,
            limit: usage.maxSyncJobsPerMonth,
            percentage: Math.round(syncJobsPercentage),
          },
          dataTransfer: {
            current: Math.round(usage.currentDataTransferMbThisMonth * 100) / 100,
            limit: usage.maxDataTransferMbPerMonth,
            percentage: Math.round(dataTransferPercentage),
          },
        },
        period: {
          start: usage.usagePeriodStart,
          end: new Date(new Date(usage.usagePeriodStart).setMonth(new Date(usage.usagePeriodStart).getMonth() + 1)),
        },
        settings: {
          emailNotificationsEnabled: usage.emailNotificationsEnabled,
        },
        warnings,
      },
    });
    
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch usage statistics' },
      { status: 500 }
    );
  }
}




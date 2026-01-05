/**
 * Usage Limits Service
 * Tracks and enforces usage limits per user
 */

import { createClient } from '@/lib/supabase/server';

export interface UsageLimits {
  maxConnections: number;
  maxSyncJobsPerMonth: number;
  maxDataTransferMbPerMonth: number;
  currentConnections: number;
  currentSyncJobsThisMonth: number;
  currentDataTransferMbThisMonth: number;
  usagePeriodStart: Date;
  emailNotificationsEnabled: boolean;
}

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage: {
    connections: number;
    syncJobs: number;
    dataTransferMb: number;
  };
  limits: {
    connections: number;
    syncJobsPerMonth: number;
    dataTransferMbPerMonth: number;
  };
}

// Default limits for beta users
const DEFAULT_LIMITS = {
  maxConnections: 5,
  maxSyncJobsPerMonth: 10,
  maxDataTransferMbPerMonth: 1000, // 1GB
};

/**
 * Get or create usage limits for a user
 */
export async function getUserUsageLimits(userId: string): Promise<UsageLimits> {
  const supabase = await createClient();
  
  // Try to get existing limits
  const { data: existing, error } = await supabase
    .from('usage_limits')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('Error fetching usage limits:', error);
    throw new Error('Failed to fetch usage limits');
  }
  
  // If exists, return it
  if (existing) {
    // Check if we need to reset monthly usage
    const periodStart = new Date(existing.usage_period_start);
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    if (periodStart < currentMonthStart) {
      // Reset monthly usage
      await resetMonthlyUsage(userId);
      // Fetch again after reset
      const { data: reset } = await supabase
        .from('usage_limits')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (reset) {
        return mapUsageLimits(reset);
      }
    }
    
    return mapUsageLimits(existing);
  }
  
  // Create new limits with defaults
  const { data: created, error: createError } = await supabase
    .from('usage_limits')
    .insert({
      user_id: userId,
      max_connections: DEFAULT_LIMITS.maxConnections,
      max_sync_jobs_per_month: DEFAULT_LIMITS.maxSyncJobsPerMonth,
      max_data_transfer_mb_per_month: DEFAULT_LIMITS.maxDataTransferMbPerMonth,
      current_connections: 0,
      current_sync_jobs_this_month: 0,
      current_data_transfer_mb_this_month: 0,
      usage_period_start: new Date().toISOString(),
      email_notifications_enabled: true,
    })
    .select()
    .single();
  
  if (createError || !created) {
    console.error('Error creating usage limits:', createError);
    throw new Error('Failed to create usage limits');
  }
  
  return mapUsageLimits(created);
}

/**
 * Check if user can create a new connection
 */
export async function checkConnectionLimit(userId: string): Promise<UsageCheckResult> {
  const limits = await getUserUsageLimits(userId);
  const currentConnections = await getCurrentConnectionCount(userId);
  
  return {
    allowed: currentConnections < limits.maxConnections,
    reason: currentConnections >= limits.maxConnections
      ? `Connection limit reached (${limits.maxConnections}). Please delete an existing connection first.`
      : undefined,
    currentUsage: {
      connections: currentConnections,
      syncJobs: limits.currentSyncJobsThisMonth,
      dataTransferMb: limits.currentDataTransferMbThisMonth,
    },
    limits: {
      connections: limits.maxConnections,
      syncJobsPerMonth: limits.maxSyncJobsPerMonth,
      dataTransferMbPerMonth: limits.maxDataTransferMbPerMonth,
    },
  };
}

/**
 * Check if user can create a new sync job
 */
export async function checkSyncJobLimit(userId: string): Promise<UsageCheckResult> {
  const limits = await getUserUsageLimits(userId);
  
  return {
    allowed: limits.currentSyncJobsThisMonth < limits.maxSyncJobsPerMonth,
    reason: limits.currentSyncJobsThisMonth >= limits.maxSyncJobsPerMonth
      ? `Monthly sync job limit reached (${limits.maxSyncJobsPerMonth}). Limit resets at the start of next month.`
      : undefined,
    currentUsage: {
      connections: await getCurrentConnectionCount(userId),
      syncJobs: limits.currentSyncJobsThisMonth,
      dataTransferMb: limits.currentDataTransferMbThisMonth,
    },
    limits: {
      connections: limits.maxConnections,
      syncJobsPerMonth: limits.maxSyncJobsPerMonth,
      dataTransferMbPerMonth: limits.maxDataTransferMbPerMonth,
    },
  };
}

/**
 * Check if user can transfer data (check data transfer limit)
 */
export async function checkDataTransferLimit(
  userId: string,
  dataSizeMb: number
): Promise<UsageCheckResult> {
  const limits = await getUserUsageLimits(userId);
  const newTotal = limits.currentDataTransferMbThisMonth + dataSizeMb;
  
  return {
    allowed: newTotal <= limits.maxDataTransferMbPerMonth,
    reason: newTotal > limits.maxDataTransferMbPerMonth
      ? `Data transfer limit would be exceeded. Current: ${limits.currentDataTransferMbThisMonth.toFixed(2)}MB / ${limits.maxDataTransferMbPerMonth}MB. Requested: ${dataSizeMb.toFixed(2)}MB.`
      : undefined,
    currentUsage: {
      connections: await getCurrentConnectionCount(userId),
      syncJobs: limits.currentSyncJobsThisMonth,
      dataTransferMb: limits.currentDataTransferMbThisMonth,
    },
    limits: {
      connections: limits.maxConnections,
      syncJobsPerMonth: limits.maxSyncJobsPerMonth,
      dataTransferMbPerMonth: limits.maxDataTransferMbPerMonth,
    },
  };
}

/**
 * Increment sync job count
 */
export async function incrementSyncJobCount(userId: string): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase.rpc('increment_sync_job_count', {
    p_user_id: userId,
  });
  
  if (error) {
    // Fallback: manual update
    const limits = await getUserUsageLimits(userId);
    await supabase
      .from('usage_limits')
      .update({
        current_sync_jobs_this_month: limits.currentSyncJobsThisMonth + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  }
}

/**
 * Increment data transfer
 */
export async function incrementDataTransfer(userId: string, dataSizeMb: number): Promise<void> {
  const supabase = await createClient();
  
  const limits = await getUserUsageLimits(userId);
  const newTotal = limits.currentDataTransferMbThisMonth + dataSizeMb;
  
  await supabase
    .from('usage_limits')
    .update({
      current_data_transfer_mb_this_month: newTotal,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  
  // Check if approaching limit and send warning
  const percentage = (newTotal / limits.maxDataTransferMbPerMonth) * 100;
  if (percentage >= 80 && percentage < 100 && limits.emailNotificationsEnabled) {
    // Will be handled by email service
  }
}

/**
 * Update connection count
 */
export async function updateConnectionCount(userId: string, count: number): Promise<void> {
  const supabase = await createClient();
  
  await supabase
    .from('usage_limits')
    .update({
      current_connections: count,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}

/**
 * Get current connection count
 */
async function getCurrentConnectionCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('connections')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error counting connections:', error);
    return 0;
  }
  
  return count || 0;
}

/**
 * Reset monthly usage (called at start of each month)
 */
async function resetMonthlyUsage(userId: string): Promise<void> {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Archive current month
  const limits = await getUserUsageLimits(userId);
  await supabase
    .from('usage_history')
    .insert({
      user_id: userId,
      period_start: limits.usagePeriodStart,
      period_end: monthStart.toISOString(),
      total_connections: limits.currentConnections,
      total_sync_jobs: limits.currentSyncJobsThisMonth,
      total_data_transfer_mb: limits.currentDataTransferMbThisMonth,
    });
  
  // Reset monthly counters
  await supabase
    .from('usage_limits')
    .update({
      current_sync_jobs_this_month: 0,
      current_data_transfer_mb_this_month: 0,
      usage_period_start: monthStart.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}

/**
 * Map database row to UsageLimits interface
 */
function mapUsageLimits(row: any): UsageLimits {
  return {
    maxConnections: row.max_connections,
    maxSyncJobsPerMonth: row.max_sync_jobs_per_month,
    maxDataTransferMbPerMonth: row.max_data_transfer_mb_per_month,
    currentConnections: row.current_connections,
    currentSyncJobsThisMonth: row.current_sync_jobs_this_month,
    currentDataTransferMbThisMonth: parseFloat(row.current_data_transfer_mb_this_month || '0'),
    usagePeriodStart: new Date(row.usage_period_start),
    emailNotificationsEnabled: row.email_notifications_enabled,
  };
}


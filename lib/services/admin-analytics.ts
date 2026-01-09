/**
 * Admin Analytics Service
 * 
 * Provides analytics and statistics for the admin dashboard
 */

import { createClient } from '@/lib/supabase/server';

export interface UserStats {
  totalUsers: number;
  newUsers24h: number;
  newUsers7d: number;
  newUsers30d: number;
  activeUsersNow: number;
  activeUsers24h: number;
}

export interface SyncStats {
  totalSyncs: number;
  completedSyncs: number;
  failedSyncs: number;
  runningSyncs: number;
  successRate: number;
  syncs24h: number;
  avgDurationSeconds: number;
}

export interface SecurityStats {
  eventsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  failedAuthAttempts: number;
  uniqueThreatIPs: number;
  recentEvents: Array<{
    eventType: string;
    severity: string;
    count: number;
    lastOccurrence: string;
  }>;
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<UserStats> {
  try {
    const supabase = await createClient();
    
    // Get total users - Note: Can't directly query auth.users via Supabase client
    // This would require admin access or a database function
    let totalUsers = 0;
    try {
      // Try to get count from user_sessions as a proxy
      const { count } = await supabase
        .from('user_sessions')
        .select('user_id', { count: 'exact', head: true });
      totalUsers = count || 0;
    } catch {
      totalUsers = 0;
    }
    
    return {
      totalUsers,
      newUsers24h: 0, // Would need to query auth.users with created_at filter
      newUsers7d: 0,
      newUsers30d: 0,
      activeUsersNow: 0,
      activeUsers24h: 0,
    };
  } catch (error) {
    console.error('[ADMIN_ANALYTICS] Error getting user stats:', error);
    return {
      totalUsers: 0,
      newUsers24h: 0,
      newUsers7d: 0,
      newUsers30d: 0,
      activeUsersNow: 0,
      activeUsers24h: 0,
    };
  }
}

/**
 * Get sync job statistics
 */
export async function getSyncStats(): Promise<SyncStats> {
  try {
    const supabase = await createClient();
    
    const { data: syncJobs, error } = await supabase
      .from('sync_jobs')
      .select('status, created_at, completed_at, started_at');
    
    if (error || !syncJobs) {
      console.error('[ADMIN_ANALYTICS] Error getting sync stats:', error);
      return {
        totalSyncs: 0,
        completedSyncs: 0,
        failedSyncs: 0,
        runningSyncs: 0,
        successRate: 0,
        syncs24h: 0,
        avgDurationSeconds: 0,
      };
    }
    
    type SyncJob = {
      status: string;
      created_at: string | null;
      completed_at: string | null;
      started_at: string | null;
    };
    
    const jobs = syncJobs as SyncJob[];
    const totalSyncs = jobs.length;
    const completedSyncs = jobs.filter(j => j.status === 'completed').length;
    const failedSyncs = jobs.filter(j => j.status === 'failed').length;
    const runningSyncs = jobs.filter(j => j.status === 'running').length;
    
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const syncs24h = jobs.filter(j => 
      j.created_at && new Date(j.created_at) > dayAgo
    ).length;
    
    const completedWithDuration = jobs.filter(j => 
      j.status === 'completed' && j.started_at && j.completed_at
    );
    
    const avgDurationSeconds = completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, j) => {
          const duration = new Date(j.completed_at!).getTime() - new Date(j.started_at!).getTime();
          return sum + (duration / 1000);
        }, 0) / completedWithDuration.length
      : 0;
    
    const successRate = totalSyncs > 0 
      ? (completedSyncs / totalSyncs) * 100 
      : 0;
    
    return {
      totalSyncs,
      completedSyncs,
      failedSyncs,
      runningSyncs,
      successRate,
      syncs24h,
      avgDurationSeconds,
    };
  } catch (error) {
    console.error('[ADMIN_ANALYTICS] Error getting sync stats:', error);
    return {
      totalSyncs: 0,
      completedSyncs: 0,
      failedSyncs: 0,
      runningSyncs: 0,
      successRate: 0,
      syncs24h: 0,
      avgDurationSeconds: 0,
    };
  }
}

/**
 * Get security statistics
 */
export async function getSecurityStats(hours: number = 24): Promise<SecurityStats> {
  try {
    const supabase = await createClient();
    
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const { data: events, error } = await supabase
      .from('security_events')
      .select('event_type, severity, ip_address, created_at')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });
    
    if (error || !events) {
      console.error('[ADMIN_ANALYTICS] Error getting security stats:', error);
      return {
        eventsBySeverity: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
        failedAuthAttempts: 0,
        uniqueThreatIPs: 0,
        recentEvents: [],
      };
    }
    
    type SecurityEvent = {
      event_type: string;
      severity: string;
      ip_address: string | null;
      created_at: string;
    };
    
    const eventList = events as SecurityEvent[];
    
    const eventsBySeverity = {
      critical: eventList.filter(e => e.severity === 'critical').length,
      high: eventList.filter(e => e.severity === 'high').length,
      medium: eventList.filter(e => e.severity === 'medium').length,
      low: eventList.filter(e => e.severity === 'low').length,
    };
    
    const failedAuthAttempts = eventList.filter(e => e.event_type === 'auth_failed').length;
    
    const uniqueThreatIPs = new Set(
      eventList.filter(e => e.severity === 'high' || e.severity === 'critical')
        .map(e => e.ip_address)
        .filter(Boolean)
    ).size;
    
    // Group recent events by type and severity
    const eventMap = new Map<string, { count: number; lastOccurrence: string; severity: string }>();
    
    eventList.forEach(event => {
      const key = `${event.event_type}_${event.severity}`;
      const existing = eventMap.get(key);
      if (existing) {
        existing.count++;
        if (new Date(event.created_at) > new Date(existing.lastOccurrence)) {
          existing.lastOccurrence = event.created_at;
        }
      } else {
        eventMap.set(key, {
          count: 1,
          lastOccurrence: event.created_at,
          severity: event.severity,
        });
      }
    });
    
    const recentEvents = Array.from(eventMap.entries()).map(([key, value]) => ({
      eventType: key.split('_')[0],
      severity: value.severity,
      count: value.count,
      lastOccurrence: value.lastOccurrence,
    }));
    
    return {
      eventsBySeverity,
      failedAuthAttempts,
      uniqueThreatIPs,
      recentEvents: recentEvents.slice(0, 10),
    };
  } catch (error) {
    console.error('[ADMIN_ANALYTICS] Error getting security stats:', error);
    return {
      eventsBySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      failedAuthAttempts: 0,
      uniqueThreatIPs: 0,
      recentEvents: [],
    };
  }
}


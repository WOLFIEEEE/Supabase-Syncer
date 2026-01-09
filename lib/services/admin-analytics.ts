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
    
    // Get unique users from connections table (users who have created connections)
    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select('user_id, created_at');
    
    // Get unique users from user_sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('user_id, created_at, last_activity');
    
    if (connectionsError && sessionsError) {
      console.error('[ADMIN_ANALYTICS] Error getting user data:', { connectionsError, sessionsError });
      return {
        totalUsers: 0,
        newUsers24h: 0,
        newUsers7d: 0,
        newUsers30d: 0,
        activeUsersNow: 0,
        activeUsers24h: 0,
      };
    }
    
    // Combine unique users from both sources
    const userSet = new Set<string>();
    const userConnectionDates = new Map<string, Date>();
    
    if (connections) {
      connections.forEach((conn: { user_id: string; created_at: string }) => {
        userSet.add(conn.user_id);
        const connDate = new Date(conn.created_at);
        const existing = userConnectionDates.get(conn.user_id);
        if (!existing || connDate < existing) {
          userConnectionDates.set(conn.user_id, connDate);
        }
      });
    }
    
    if (sessions) {
      sessions.forEach((session: { user_id: string; created_at: string }) => {
        userSet.add(session.user_id);
        const sessionDate = new Date(session.created_at);
        const existing = userConnectionDates.get(session.user_id);
        if (!existing || sessionDate < existing) {
          userConnectionDates.set(session.user_id, sessionDate);
        }
      });
    }
    
    const totalUsers = userSet.size;
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    // Count new users based on first connection/session date
    let newUsers24h = 0;
    let newUsers7d = 0;
    let newUsers30d = 0;
    
    userConnectionDates.forEach((firstSeen) => {
      if (firstSeen > dayAgo) newUsers24h++;
      if (firstSeen > weekAgo) newUsers7d++;
      if (firstSeen > monthAgo) newUsers30d++;
    });
    
    // Active users - based on sessions
    let activeUsersNow = 0;
    let activeUsers24h = 0;
    const activeUserSet = new Set<string>();
    const activeUserSet24h = new Set<string>();
    
    if (sessions) {
      sessions.forEach((session: { user_id: string; last_activity: string }) => {
        const lastActivity = new Date(session.last_activity);
        if (lastActivity > fiveMinutesAgo) {
          activeUserSet.add(session.user_id);
        }
        if (lastActivity > dayAgo) {
          activeUserSet24h.add(session.user_id);
        }
      });
    }
    
    activeUsersNow = activeUserSet.size;
    activeUsers24h = activeUserSet24h.size;
    
    return {
      totalUsers,
      newUsers24h,
      newUsers7d,
      newUsers30d,
      activeUsersNow,
      activeUsers24h,
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

// ============================================================================
// NEW ANALYTICS FUNCTIONS
// ============================================================================

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface UserGrowthData {
  data: TimeSeriesDataPoint[];
  total: number;
  growthRate: number;
}

export interface SyncPerformanceData {
  data: TimeSeriesDataPoint[];
  avgDuration: number;
  successRate: number;
}

export interface APIUsageData {
  data: TimeSeriesDataPoint[];
  totalRequests: number;
  avgPerMinute: number;
}

export interface TopUser {
  userId: string;
  email?: string;
  syncCount: number;
  connectionCount: number;
  lastActivity?: string;
}

export interface TopConnection {
  connectionId: string;
  name: string;
  syncCount: number;
  userId: string;
}

/**
 * Get user growth data over time
 */
export async function getUserGrowthData(days: number = 30): Promise<UserGrowthData> {
  try {
    const supabase = await createClient();
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    // Get connections grouped by date
    const { data: connections } = await supabase
      .from('connections')
      .select('user_id, created_at')
      .gte('created_at', startDate.toISOString());
    
    // Get sessions grouped by date
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('user_id, created_at')
      .gte('created_at', startDate.toISOString());
    
    // Combine and get unique users per day
    const userFirstSeen = new Map<string, Date>();
    
    if (connections) {
      connections.forEach((conn: { user_id: string; created_at: string }) => {
        const date = new Date(conn.created_at);
        const existing = userFirstSeen.get(conn.user_id);
        if (!existing || date < existing) {
          userFirstSeen.set(conn.user_id, date);
        }
      });
    }
    
    if (sessions) {
      sessions.forEach((session: { user_id: string; created_at: string }) => {
        const date = new Date(session.created_at);
        const existing = userFirstSeen.get(session.user_id);
        if (!existing || date < existing) {
          userFirstSeen.set(session.user_id, date);
        }
      });
    }
    
    // Group by day
    const dailyCounts = new Map<string, number>();
    userFirstSeen.forEach((date) => {
      const dayKey = date.toISOString().split('T')[0];
      dailyCounts.set(dayKey, (dailyCounts.get(dayKey) || 0) + 1);
    });
    
    // Create time series
    const data: TimeSeriesDataPoint[] = [];
    let cumulative = 0;
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayKey = date.toISOString().split('T')[0];
      const newUsers = dailyCounts.get(dayKey) || 0;
      cumulative += newUsers;
      data.push({
        date: dayKey,
        value: cumulative,
        label: `${newUsers} new`,
      });
    }
    
    const total = cumulative;
    const firstValue = data[0]?.value || 0;
    const lastValue = data[data.length - 1]?.value || 0;
    const growthRate = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
    
    return { data, total, growthRate };
  } catch (error) {
    console.error('[ADMIN_ANALYTICS] Error getting user growth data:', error);
    return { data: [], total: 0, growthRate: 0 };
  }
}

/**
 * Get sync performance data over time
 */
export async function getSyncPerformanceData(days: number = 30): Promise<SyncPerformanceData> {
  try {
    const supabase = await createClient();
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const { data: syncJobs } = await supabase
      .from('sync_jobs')
      .select('status, created_at, started_at, completed_at')
      .gte('created_at', startDate.toISOString());
    
    if (!syncJobs) {
      return { data: [], avgDuration: 0, successRate: 0 };
    }
    
    // Group by day
    const dailyStats = new Map<string, { completed: number; failed: number; total: number; durations: number[] }>();
    
    syncJobs.forEach((job: { status: string; created_at: string; started_at: string | null; completed_at: string | null }) => {
      const dayKey = new Date(job.created_at).toISOString().split('T')[0];
      const stats = dailyStats.get(dayKey) || { completed: 0, failed: 0, total: 0, durations: [] };
      stats.total++;
      
      if (job.status === 'completed') {
        stats.completed++;
        if (job.started_at && job.completed_at) {
          const duration = new Date(job.completed_at).getTime() - new Date(job.started_at).getTime();
          stats.durations.push(duration / 1000); // Convert to seconds
        }
      } else if (job.status === 'failed') {
        stats.failed++;
      }
      
      dailyStats.set(dayKey, stats);
    });
    
    // Create time series
    const data: TimeSeriesDataPoint[] = [];
    let totalCompleted = 0;
    let totalFailed = 0;
    let allDurations: number[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayKey = date.toISOString().split('T')[0];
      const stats = dailyStats.get(dayKey) || { completed: 0, failed: 0, total: 0, durations: [] };
      
      const successRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
      totalCompleted += stats.completed;
      totalFailed += stats.failed;
      allDurations.push(...stats.durations);
      
      data.push({
        date: dayKey,
        value: successRate,
        label: `${stats.completed}/${stats.total}`,
      });
    }
    
    const total = totalCompleted + totalFailed;
    const successRate = total > 0 ? (totalCompleted / total) * 100 : 0;
    const avgDuration = allDurations.length > 0
      ? allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length
      : 0;
    
    return { data, avgDuration, successRate };
  } catch (error) {
    console.error('[ADMIN_ANALYTICS] Error getting sync performance data:', error);
    return { data: [], avgDuration: 0, successRate: 0 };
  }
}

/**
 * Get API usage data over time
 */
export async function getAPIUsageData(days: number = 30): Promise<APIUsageData> {
  try {
    const supabase = await createClient();
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    // Use security_events as proxy for API usage
    const { data: events } = await supabase
      .from('security_events')
      .select('created_at, event_type')
      .gte('created_at', startDate.toISOString())
      .in('event_type', ['auth_success', 'api_error']);
    
    if (!events) {
      return { data: [], totalRequests: 0, avgPerMinute: 0 };
    }
    
    // Group by day
    const dailyCounts = new Map<string, number>();
    events.forEach((event: { created_at: string }) => {
      const dayKey = new Date(event.created_at).toISOString().split('T')[0];
      dailyCounts.set(dayKey, (dailyCounts.get(dayKey) || 0) + 1);
    });
    
    // Create time series
    const data: TimeSeriesDataPoint[] = [];
    let totalRequests = 0;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayKey = date.toISOString().split('T')[0];
      const count = dailyCounts.get(dayKey) || 0;
      totalRequests += count;
      
      data.push({
        date: dayKey,
        value: count,
        label: `${count} requests`,
      });
    }
    
    const totalMinutes = days * 24 * 60;
    const avgPerMinute = totalMinutes > 0 ? totalRequests / totalMinutes : 0;
    
    return { data, totalRequests, avgPerMinute };
  } catch (error) {
    console.error('[ADMIN_ANALYTICS] Error getting API usage data:', error);
    return { data: [], totalRequests: 0, avgPerMinute: 0 };
  }
}

/**
 * Get top active users
 */
export async function getTopUsers(limit: number = 10): Promise<TopUser[]> {
  try {
    const supabase = await createClient();
    
    // Get sync counts per user
    const { data: syncJobs } = await supabase
      .from('sync_jobs')
      .select('user_id');
    
    // Get connection counts per user
    const { data: connections } = await supabase
      .from('connections')
      .select('user_id');
    
    // Get last activity from sessions
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('user_id, last_activity')
      .order('last_activity', { ascending: false });
    
    const userStats = new Map<string, { syncCount: number; connectionCount: number; lastActivity?: Date }>();
    
    if (syncJobs) {
      syncJobs.forEach((job: { user_id: string }) => {
        const stats = userStats.get(job.user_id) || { syncCount: 0, connectionCount: 0 };
        stats.syncCount++;
        userStats.set(job.user_id, stats);
      });
    }
    
    if (connections) {
      connections.forEach((conn: { user_id: string }) => {
        const stats = userStats.get(conn.user_id) || { syncCount: 0, connectionCount: 0 };
        stats.connectionCount++;
        userStats.set(conn.user_id, stats);
      });
    }
    
    if (sessions) {
      sessions.forEach((session: { user_id: string; last_activity: string }) => {
        const stats = userStats.get(session.user_id) || { syncCount: 0, connectionCount: 0 };
        const lastActivity = new Date(session.last_activity);
        if (!stats.lastActivity || lastActivity > stats.lastActivity) {
          stats.lastActivity = lastActivity;
        }
        userStats.set(session.user_id, stats);
      });
    }
    
    // Convert to array and sort by activity
    const topUsers: TopUser[] = Array.from(userStats.entries())
      .map(([userId, stats]) => ({
        userId,
        syncCount: stats.syncCount,
        connectionCount: stats.connectionCount,
        lastActivity: stats.lastActivity?.toISOString(),
      }))
      .sort((a, b) => (b.syncCount + b.connectionCount) - (a.syncCount + a.connectionCount))
      .slice(0, limit);
    
    return topUsers;
  } catch (error) {
    console.error('[ADMIN_ANALYTICS] Error getting top users:', error);
    return [];
  }
}

/**
 * Get top connections by usage
 */
export async function getTopConnections(limit: number = 10): Promise<TopConnection[]> {
  try {
    const supabase = await createClient();
    
    // Get sync counts per connection (source and target)
    const { data: syncJobs } = await supabase
      .from('sync_jobs')
      .select('source_connection_id, target_connection_id');
    
    // Get connection details
    const { data: allConnections } = await supabase
      .from('connections')
      .select('id, name, user_id');
    
    if (!syncJobs || !allConnections) {
      return [];
    }
    
    const connectionMap = new Map<string, { name: string; userId: string }>();
    allConnections.forEach((conn: { id: string; name: string; user_id: string }) => {
      connectionMap.set(conn.id, { name: conn.name, userId: conn.user_id });
    });
    
    const connectionCounts = new Map<string, number>();
    
    syncJobs.forEach((job: { source_connection_id: string; target_connection_id: string }) => {
      connectionCounts.set(
        job.source_connection_id,
        (connectionCounts.get(job.source_connection_id) || 0) + 1
      );
      connectionCounts.set(
        job.target_connection_id,
        (connectionCounts.get(job.target_connection_id) || 0) + 1
      );
    });
    
    const topConnections: TopConnection[] = Array.from(connectionCounts.entries())
      .map(([connectionId, syncCount]) => {
        const conn = connectionMap.get(connectionId);
        return {
          connectionId,
          name: conn?.name || 'Unknown',
          syncCount,
          userId: conn?.userId || '',
        };
      })
      .sort((a, b) => b.syncCount - a.syncCount)
      .slice(0, limit);
    
    return topConnections;
  } catch (error) {
    console.error('[ADMIN_ANALYTICS] Error getting top connections:', error);
    return [];
  }
}

/**
 * Get error trends over time
 */
export async function getErrorTrends(days: number = 30): Promise<TimeSeriesDataPoint[]> {
  try {
    const supabase = await createClient();
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    // Get failed syncs
    const { data: failedSyncs } = await supabase
      .from('sync_jobs')
      .select('created_at')
      .eq('status', 'failed')
      .gte('created_at', startDate.toISOString());
    
    // Get security events with high severity
    const { data: securityEvents } = await supabase
      .from('security_events')
      .select('created_at, severity')
      .gte('created_at', startDate.toISOString())
      .in('severity', ['high', 'critical']);
    
    // Combine and group by day
    const dailyErrors = new Map<string, number>();
    
    if (failedSyncs) {
      failedSyncs.forEach((sync: { created_at: string }) => {
        const dayKey = new Date(sync.created_at).toISOString().split('T')[0];
        dailyErrors.set(dayKey, (dailyErrors.get(dayKey) || 0) + 1);
      });
    }
    
    if (securityEvents) {
      securityEvents.forEach((event: { created_at: string }) => {
        const dayKey = new Date(event.created_at).toISOString().split('T')[0];
        dailyErrors.set(dayKey, (dailyErrors.get(dayKey) || 0) + 1);
      });
    }
    
    // Create time series
    const data: TimeSeriesDataPoint[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayKey = date.toISOString().split('T')[0];
      const count = dailyErrors.get(dayKey) || 0;
      
      data.push({
        date: dayKey,
        value: count,
        label: `${count} errors`,
      });
    }
    
    return data;
  } catch (error) {
    console.error('[ADMIN_ANALYTICS] Error getting error trends:', error);
    return [];
  }
}


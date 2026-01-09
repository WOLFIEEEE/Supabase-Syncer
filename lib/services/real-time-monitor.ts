/**
 * Real-Time Monitor Service
 * 
 * Provides real-time metrics and system status monitoring
 */

import { createClient } from '@/lib/supabase/server';

export interface LiveMetrics {
  activeUsersCount: number;
  activeSyncsCount: number;
  apiRequestsPerMinute: number;
  errorRate: number;
}

export interface SystemStatus {
  api: 'operational' | 'degraded' | 'down';
  database: 'operational' | 'degraded' | 'down';
  queue: 'operational' | 'degraded' | 'down';
  cache: 'operational' | 'degraded' | 'down';
}

/**
 * Get live metrics
 */
export async function getLiveMetrics(): Promise<LiveMetrics> {
  try {
    const supabase = await createClient();
    
    // Get active syncs (running in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    let activeSyncs = null;
    try {
      const result = await supabase
        .from('sync_jobs')
        .select('id')
        .eq('status', 'running')
        .gte('started_at', fiveMinutesAgo.toISOString());
      activeSyncs = result.data;
    } catch {
      activeSyncs = null;
    }
    
    const activeSyncsCount = activeSyncs?.length || 0;
    
    // Get active users (sessions in last 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    let activeSessions = null;
    try {
      const result = await supabase
        .from('user_sessions')
        .select('user_id')
        .gte('last_activity', fifteenMinutesAgo.toISOString());
      activeSessions = result.data;
    } catch {
      activeSessions = null;
    }
    
    const activeUsersCount = activeSessions?.length || 0;
    
    // Get recent errors (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let recentEvents = null;
    try {
      const result = await supabase
        .from('security_events')
        .select('event_type, severity')
        .gte('created_at', oneHourAgo.toISOString());
      recentEvents = result.data;
    } catch {
      recentEvents = null;
    }
    
    type SecurityEvent = {
      event_type: string;
      severity: string;
    };
    
    const eventList = (recentEvents || []) as SecurityEvent[];
    const totalEvents = eventList.length;
    const errorEvents = eventList.filter(e => 
      e.severity === 'high' || e.severity === 'critical' || e.event_type === 'api_error'
    ).length;
    
    const errorRate = totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;
    
    // Estimate API requests per minute (based on security events)
    const apiRequestsPerMinute = totalEvents > 0 ? totalEvents / 60 : 0;
    
    return {
      activeUsersCount,
      activeSyncsCount,
      apiRequestsPerMinute,
      errorRate,
    };
  } catch (error) {
    console.error('[REAL_TIME_MONITOR] Error getting live metrics:', error);
    return {
      activeUsersCount: 0,
      activeSyncsCount: 0,
      apiRequestsPerMinute: 0,
      errorRate: 0,
    };
  }
}

/**
 * Get system status
 */
export async function getSystemStatus(): Promise<SystemStatus> {
  try {
    const supabase = await createClient();
    
    // Test database connection
    const { error: dbError } = await supabase
      .from('connections')
      .select('id')
      .limit(1);
    
    const database = dbError ? 'down' : 'operational';
    
    // For now, assume other services are operational
    // In a real implementation, you'd check actual service health
    return {
      api: 'operational',
      database,
      queue: 'operational',
      cache: 'operational',
    };
  } catch (error) {
    console.error('[REAL_TIME_MONITOR] Error getting system status:', error);
    return {
      api: 'degraded',
      database: 'degraded',
      queue: 'degraded',
      cache: 'degraded',
    };
  }
}


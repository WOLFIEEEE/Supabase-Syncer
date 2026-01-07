/**
 * Security Alerting Service
 * 
 * Monitors security events and generates alerts for:
 * - Multiple failed login attempts
 * - Rate limit violations
 * - SQL injection attempts
 * - Unusual access patterns
 * - New device logins
 */

import { createClient } from '@/lib/supabase/server';
import { 
  SecurityEventType, 
  SecuritySeverity, 
  getSecurityEventsByType,
  countSecurityEventsBySeverity,
} from './security-logger';

// ============================================================================
// TYPES
// ============================================================================

export type AlertType =
  | 'brute_force_attempt'
  | 'rate_limit_abuse'
  | 'sql_injection_detected'
  | 'suspicious_access'
  | 'new_device_login'
  | 'multiple_csrf_failures'
  | 'unusual_activity';

export interface SecurityAlert {
  alertType: AlertType;
  severity: SecuritySeverity;
  userId?: string;
  ipAddress?: string;
  title: string;
  description: string;
  details?: Record<string, unknown>;
}

export interface StoredAlert extends SecurityAlert {
  id: string;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
}

// ============================================================================
// ALERT THRESHOLDS
// ============================================================================

export const ALERT_THRESHOLDS = {
  // Failed logins from same IP to trigger brute force alert
  BRUTE_FORCE_ATTEMPTS: 5,
  BRUTE_FORCE_WINDOW_MINUTES: 15,
  
  // Rate limit violations to trigger abuse alert
  RATE_LIMIT_VIOLATIONS: 10,
  RATE_LIMIT_WINDOW_MINUTES: 30,
  
  // CSRF failures to trigger alert
  CSRF_FAILURES: 3,
  CSRF_WINDOW_MINUTES: 10,
};

// ============================================================================
// ALERT CREATION
// ============================================================================

/**
 * Create a security alert
 */
export async function createSecurityAlert(alert: SecurityAlert): Promise<string | null> {
  try {
    const supabase = await createClient();
    
    // Type assertion needed because security_alerts table is created via migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('security_alerts')
      .insert({
        alert_type: alert.alertType,
        severity: alert.severity,
        user_id: alert.userId || null,
        ip_address: alert.ipAddress || null,
        title: alert.title,
        description: alert.description,
        details: alert.details || null,
      })
      .select('id')
      .single();
    
    if (error || !data) {
      console.error('Failed to create security alert:', error);
      return null;
    }
    
    // Send notification for high/critical alerts
    if (alert.severity === 'high' || alert.severity === 'critical') {
      await sendAlertNotification(alert);
    }
    
    return data.id;
  } catch (error) {
    console.error('Failed to create security alert:', error);
    return null;
  }
}

/**
 * Create brute force alert
 */
export async function createBruteForceAlert(
  ipAddress: string,
  attemptCount: number,
  userId?: string
): Promise<string | null> {
  return createSecurityAlert({
    alertType: 'brute_force_attempt',
    severity: 'high',
    userId,
    ipAddress,
    title: 'Potential Brute Force Attack Detected',
    description: `${attemptCount} failed login attempts detected from IP ${ipAddress} in the last ${ALERT_THRESHOLDS.BRUTE_FORCE_WINDOW_MINUTES} minutes.`,
    details: {
      attemptCount,
      windowMinutes: ALERT_THRESHOLDS.BRUTE_FORCE_WINDOW_MINUTES,
    },
  });
}

/**
 * Create SQL injection alert
 */
export async function createSQLInjectionAlert(
  ipAddress: string,
  endpoint: string,
  userId?: string,
  pattern?: string
): Promise<string | null> {
  return createSecurityAlert({
    alertType: 'sql_injection_detected',
    severity: 'critical',
    userId,
    ipAddress,
    title: 'SQL Injection Attempt Detected',
    description: `A potential SQL injection attempt was detected from IP ${ipAddress} on endpoint ${endpoint}.`,
    details: {
      endpoint,
      pattern: pattern ? '[REDACTED]' : undefined, // Don't expose the actual pattern
    },
  });
}

/**
 * Create rate limit abuse alert
 */
export async function createRateLimitAbuseAlert(
  ipAddress: string,
  violationCount: number,
  userId?: string
): Promise<string | null> {
  return createSecurityAlert({
    alertType: 'rate_limit_abuse',
    severity: 'medium',
    userId,
    ipAddress,
    title: 'Rate Limit Abuse Detected',
    description: `${violationCount} rate limit violations detected from IP ${ipAddress} in the last ${ALERT_THRESHOLDS.RATE_LIMIT_WINDOW_MINUTES} minutes.`,
    details: {
      violationCount,
      windowMinutes: ALERT_THRESHOLDS.RATE_LIMIT_WINDOW_MINUTES,
    },
  });
}

// ============================================================================
// ALERT NOTIFICATIONS
// ============================================================================

/**
 * Send notification for a security alert
 */
async function sendAlertNotification(alert: SecurityAlert): Promise<void> {
  // Log to console for now
  console.warn(`[SECURITY ALERT - ${alert.severity.toUpperCase()}]`, {
    type: alert.alertType,
    title: alert.title,
    description: alert.description,
    userId: alert.userId,
    ipAddress: alert.ipAddress,
  });
  
  // In production, you would send emails, Slack notifications, etc.
  // Example with email (requires email service setup):
  // await sendEmail({
  //   to: process.env.SECURITY_ALERT_EMAIL,
  //   subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
  //   body: alert.description,
  // });
  
  // Example with webhook (for Slack, Discord, etc.):
  const webhookUrl = process.env.SECURITY_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *Security Alert* [${alert.severity.toUpperCase()}]\n*${alert.title}*\n${alert.description}`,
          // Slack-specific formatting
          attachments: [{
            color: alert.severity === 'critical' ? 'danger' : 'warning',
            fields: [
              { title: 'Type', value: alert.alertType, short: true },
              { title: 'IP', value: alert.ipAddress || 'Unknown', short: true },
            ],
          }],
        }),
      });
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }
}

// ============================================================================
// ALERT MONITORING
// ============================================================================

/**
 * Check for brute force attempts and create alerts
 */
export async function checkForBruteForce(): Promise<void> {
  try {
    const supabase = await createClient();
    const windowStart = new Date(Date.now() - ALERT_THRESHOLDS.BRUTE_FORCE_WINDOW_MINUTES * 60 * 1000);
    
    // Get failed login attempts grouped by IP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('security_events')
      .select('ip_address, user_id')
      .eq('event_type', 'auth_failed')
      .gte('created_at', windowStart.toISOString());
    
    if (error || !data) return;
    
    // Group by IP
    const byIP: Record<string, { count: number; userId?: string }> = {};
    for (const event of data) {
      const ip = event.ip_address || 'unknown';
      if (!byIP[ip]) {
        byIP[ip] = { count: 0, userId: event.user_id };
      }
      byIP[ip].count++;
    }
    
    // Check for threshold violations
    for (const [ip, { count, userId }] of Object.entries(byIP)) {
      if (count >= ALERT_THRESHOLDS.BRUTE_FORCE_ATTEMPTS) {
        // Check if alert already exists for this IP recently
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existingAlert } = await (supabase as any)
          .from('security_alerts')
          .select('id')
          .eq('alert_type', 'brute_force_attempt')
          .eq('ip_address', ip)
          .gte('created_at', windowStart.toISOString())
          .single();
        
        if (!existingAlert) {
          await createBruteForceAlert(ip, count, userId);
        }
      }
    }
  } catch (error) {
    console.error('Failed to check for brute force:', error);
  }
}

/**
 * Check for rate limit abuse and create alerts
 */
export async function checkForRateLimitAbuse(): Promise<void> {
  try {
    const supabase = await createClient();
    const windowStart = new Date(Date.now() - ALERT_THRESHOLDS.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
    
    // Get rate limit violations grouped by IP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('security_events')
      .select('ip_address, user_id')
      .eq('event_type', 'rate_limit_exceeded')
      .gte('created_at', windowStart.toISOString());
    
    if (error || !data) return;
    
    // Group by IP
    const byIP: Record<string, { count: number; userId?: string }> = {};
    for (const event of data) {
      const ip = event.ip_address || 'unknown';
      if (!byIP[ip]) {
        byIP[ip] = { count: 0, userId: event.user_id };
      }
      byIP[ip].count++;
    }
    
    // Check for threshold violations
    for (const [ip, { count, userId }] of Object.entries(byIP)) {
      if (count >= ALERT_THRESHOLDS.RATE_LIMIT_VIOLATIONS) {
        await createRateLimitAbuseAlert(ip, count, userId);
      }
    }
  } catch (error) {
    console.error('Failed to check for rate limit abuse:', error);
  }
}

// ============================================================================
// ALERT MANAGEMENT
// ============================================================================

/**
 * Get unacknowledged alerts
 */
export async function getUnacknowledgedAlerts(limit = 50): Promise<StoredAlert[]> {
  try {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('security_alerts')
      .select('*')
      .eq('acknowledged', false)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error || !data) return [];
    
    return data.map(mapAlertRow);
  } catch {
    return [];
  }
}

/**
 * Get alerts for a specific user
 */
export async function getAlertsForUser(userId: string, limit = 50): Promise<StoredAlert[]> {
  try {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('security_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error || !data) return [];
    
    return data.map(mapAlertRow);
  } catch {
    return [];
  }
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(
  alertId: string,
  acknowledgedBy: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('security_alerts')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: acknowledgedBy,
      })
      .eq('id', alertId);
    
    return !error;
  } catch {
    return false;
  }
}

/**
 * Resolve an alert
 */
export async function resolveAlert(
  alertId: string,
  resolvedBy: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('security_alerts')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
      })
      .eq('id', alertId);
    
    return !error;
  } catch {
    return false;
  }
}

/**
 * Get alert summary
 */
export async function getAlertSummary(): Promise<{
  total: number;
  unacknowledged: number;
  unresolved: number;
  bySeverity: Record<SecuritySeverity, number>;
}> {
  try {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('security_alerts')
      .select('severity, acknowledged, resolved');
    
    if (error || !data) {
      return {
        total: 0,
        unacknowledged: 0,
        unresolved: 0,
        bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      };
    }
    
    const bySeverity: Record<SecuritySeverity, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    let unacknowledged = 0;
    let unresolved = 0;
    
    for (const alert of data) {
      bySeverity[alert.severity as SecuritySeverity]++;
      if (!alert.acknowledged) unacknowledged++;
      if (!alert.resolved) unresolved++;
    }
    
    return {
      total: data.length,
      unacknowledged,
      unresolved,
      bySeverity,
    };
  } catch {
    return {
      total: 0,
      unacknowledged: 0,
      unresolved: 0,
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapAlertRow(row: Record<string, unknown>): StoredAlert {
  return {
    id: row.id as string,
    alertType: row.alert_type as AlertType,
    severity: row.severity as SecuritySeverity,
    userId: row.user_id as string | undefined,
    ipAddress: row.ip_address as string | undefined,
    title: row.title as string,
    description: row.description as string,
    details: row.details as Record<string, unknown> | undefined,
    acknowledged: row.acknowledged as boolean,
    acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at as string) : undefined,
    resolved: row.resolved as boolean,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at as string) : undefined,
    createdAt: new Date(row.created_at as string),
  };
}


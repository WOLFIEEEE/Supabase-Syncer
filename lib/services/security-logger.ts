/**
 * Security Event Logger
 * 
 * Provides logging for security events:
 * - Failed authentication attempts
 * - Rate limit violations
 * - CSRF validation failures
 * - SQL injection attempt patterns
 * - Permission denied errors
 * - Unusual access patterns
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/services/logger';

// ============================================================================
// TYPES
// ============================================================================

export type SecurityEventType =
  | 'auth_failed'
  | 'auth_success'
  | 'rate_limit_exceeded'
  | 'csrf_failed'
  | 'sql_injection_attempt'
  | 'permission_denied'
  | 'invalid_input'
  | 'session_expired'
  | 'session_revoked'
  | 'suspicious_activity'
  | 'new_device_login'
  | 'password_changed'
  | 'api_error';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEvent {
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  details?: Record<string, unknown>;
  requestId?: string;
}

export interface StoredSecurityEvent extends SecurityEvent {
  id: string;
  createdAt: Date;
}

// ============================================================================
// SEVERITY MAPPING
// ============================================================================

const EVENT_SEVERITY: Record<SecurityEventType, SecuritySeverity> = {
  auth_failed: 'medium',
  auth_success: 'low',
  rate_limit_exceeded: 'medium',
  csrf_failed: 'high',
  sql_injection_attempt: 'critical',
  permission_denied: 'medium',
  invalid_input: 'low',
  session_expired: 'low',
  session_revoked: 'low',
  suspicious_activity: 'high',
  new_device_login: 'medium',
  password_changed: 'medium',
  api_error: 'low',
};

// ============================================================================
// SENSITIVE DATA PATTERNS
// ============================================================================

const SENSITIVE_PATTERNS = [
  // Passwords
  /password[s]?\s*[=:]\s*['"]?[^'"}\s]+/gi,
  // API keys
  /api[_-]?key\s*[=:]\s*['"]?[^'"}\s]+/gi,
  // Tokens
  /token\s*[=:]\s*['"]?[^'"}\s]+/gi,
  // Connection strings
  /postgres(ql)?:\/\/[^@]+@[^\s'"]+/gi,
  // Email addresses (partial redaction)
  /([a-zA-Z0-9._-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
  // Credit card numbers
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  // SSN
  /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
];

// ============================================================================
// SECURITY LOGGER CLASS
// ============================================================================

class SecurityLogger {
  private queue: SecurityEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL_MS = 5000; // Flush every 5 seconds
  private readonly MAX_QUEUE_SIZE = 100;
  
  constructor() {
    this.startFlushInterval();
  }
  
  /**
   * Log a security event
   */
  async log(event: SecurityEvent): Promise<void> {
    // Automatically set severity if not provided
    const severity = event.severity || EVENT_SEVERITY[event.eventType] || 'low';
    
    // Redact sensitive data from details
    const sanitizedDetails = event.details 
      ? this.redactSensitiveData(event.details)
      : undefined;
    
    const sanitizedEvent: SecurityEvent = {
      ...event,
      severity,
      details: sanitizedDetails,
    };
    
    // Add to queue
    this.queue.push(sanitizedEvent);
    
    // Flush if queue is full
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      await this.flush();
    }
    
    // For critical events, flush immediately
    if (severity === 'critical') {
      await this.flush();
      logger.error('[SECURITY CRITICAL]', { event: sanitizedEvent });
    }
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[SECURITY ${severity.toUpperCase()}] ${event.eventType}`, { details: sanitizedDetails });
    }
  }
  
  /**
   * Flush queued events to database
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    
    const events = [...this.queue];
    this.queue = [];
    
    try {
      const supabase = await createClient();
      
      const records = events.map(event => ({
        event_type: event.eventType,
        severity: event.severity,
        user_id: event.userId || null,
        ip_address: event.ipAddress || null,
        user_agent: event.userAgent || null,
        endpoint: event.endpoint || null,
        method: event.method || null,
        details: event.details || null,
        request_id: event.requestId || null,
      }));
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('security_events')
        .insert(records);
      
      if (error) {
        logger.error('Failed to save security events', { error });
        // Put events back in queue for retry
        this.queue.unshift(...events);
      }
    } catch (error) {
      logger.error('Failed to flush security events', { error });
      // Put events back in queue for retry
      this.queue.unshift(...events);
    }
  }
  
  /**
   * Start the flush interval
   */
  private startFlushInterval(): void {
    if (this.flushInterval) return;
    
    this.flushInterval = setInterval(() => {
      this.flush().catch((err) => logger.error('Flush interval error', { error: err }));
    }, this.FLUSH_INTERVAL_MS);
    
    // Don't prevent Node.js from exiting
    if (this.flushInterval.unref) {
      this.flushInterval.unref();
    }
  }
  
  /**
   * Redact sensitive data from object
   */
  private redactSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Check if key suggests sensitive data
      const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
        result[key] = '[REDACTED]';
        continue;
      }
      
      // Check if value is a string that might contain sensitive data
      if (typeof value === 'string') {
        let sanitized = value;
        for (const pattern of SENSITIVE_PATTERNS) {
          sanitized = sanitized.replace(pattern, '[REDACTED]');
        }
        result[key] = sanitized;
      } else if (typeof value === 'object' && value !== null) {
        // Recursively redact nested objects
        result[key] = this.redactSensitiveData(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let securityLogger: SecurityLogger | null = null;

function getSecurityLogger(): SecurityLogger {
  if (!securityLogger) {
    securityLogger = new SecurityLogger();
  }
  return securityLogger;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Log a security event
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  const logger = getSecurityLogger();
  await logger.log(event);
}

/**
 * Log an authentication failure
 */
export async function logAuthFailure(
  ipAddress?: string,
  userAgent?: string,
  details?: Record<string, unknown>
): Promise<void> {
  await logSecurityEvent({
    eventType: 'auth_failed',
    severity: 'medium',
    ipAddress,
    userAgent,
    details,
  });
}

/**
 * Log a rate limit violation
 */
export async function logRateLimitExceeded(
  userId?: string,
  ipAddress?: string,
  endpoint?: string,
  details?: Record<string, unknown>
): Promise<void> {
  await logSecurityEvent({
    eventType: 'rate_limit_exceeded',
    severity: 'medium',
    userId,
    ipAddress,
    endpoint,
    details,
  });
}

/**
 * Log a CSRF validation failure
 */
export async function logCSRFFailure(
  ipAddress?: string,
  endpoint?: string,
  details?: Record<string, unknown>
): Promise<void> {
  await logSecurityEvent({
    eventType: 'csrf_failed',
    severity: 'high',
    ipAddress,
    endpoint,
    details,
  });
}

/**
 * Log a potential SQL injection attempt
 */
export async function logSQLInjectionAttempt(
  userId?: string,
  ipAddress?: string,
  endpoint?: string,
  details?: Record<string, unknown>
): Promise<void> {
  await logSecurityEvent({
    eventType: 'sql_injection_attempt',
    severity: 'critical',
    userId,
    ipAddress,
    endpoint,
    details,
  });
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  userId?: string,
  ipAddress?: string,
  details?: Record<string, unknown>
): Promise<void> {
  await logSecurityEvent({
    eventType: 'suspicious_activity',
    severity: 'high',
    userId,
    ipAddress,
    details,
  });
}

/**
 * Flush all pending security events
 */
export async function flushSecurityEvents(): Promise<void> {
  const logger = getSecurityLogger();
  await logger.flush();
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get recent security events for a user
 */
export async function getSecurityEventsForUser(
  userId: string,
  limit = 50
): Promise<StoredSecurityEvent[]> {
  try {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('security_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error || !data) return [];
    
    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      eventType: row.event_type as SecurityEventType,
      severity: row.severity as SecuritySeverity,
      userId: row.user_id as string | undefined,
      ipAddress: row.ip_address as string | undefined,
      userAgent: row.user_agent as string | undefined,
      endpoint: row.endpoint as string | undefined,
      method: row.method as string | undefined,
      details: row.details as Record<string, unknown> | undefined,
      requestId: row.request_id as string | undefined,
      createdAt: new Date(row.created_at as string),
    }));
  } catch {
    return [];
  }
}

/**
 * Get security events by type
 */
export async function getSecurityEventsByType(
  eventType: SecurityEventType,
  limit = 50
): Promise<StoredSecurityEvent[]> {
  try {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('security_events')
      .select('*')
      .eq('event_type', eventType)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error || !data) return [];
    
    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      eventType: row.event_type as SecurityEventType,
      severity: row.severity as SecuritySeverity,
      userId: row.user_id as string | undefined,
      ipAddress: row.ip_address as string | undefined,
      userAgent: row.user_agent as string | undefined,
      endpoint: row.endpoint as string | undefined,
      method: row.method as string | undefined,
      details: row.details as Record<string, unknown> | undefined,
      requestId: row.request_id as string | undefined,
      createdAt: new Date(row.created_at as string),
    }));
  } catch {
    return [];
  }
}

/**
 * Count security events by severity in last N hours
 */
export async function countSecurityEventsBySeverity(
  hours = 24
): Promise<Record<SecuritySeverity, number>> {
  try {
    const supabase = await createClient();
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('security_events')
      .select('severity')
      .gte('created_at', since.toISOString());
    
    if (error || !data) {
      return { low: 0, medium: 0, high: 0, critical: 0 };
    }
    
    const counts: Record<SecuritySeverity, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const row of data as Array<{ severity: string }>) {
      counts[row.severity as SecuritySeverity]++;
    }
    
    return counts;
  } catch {
    return { low: 0, medium: 0, high: 0, critical: 0 };
  }
}


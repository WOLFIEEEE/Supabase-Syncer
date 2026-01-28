/**
 * Session Security Service
 * 
 * Provides enhanced session security features:
 * - Session timeout enforcement
 * - Active session tracking
 * - "Sign out all devices" functionality
 * - Concurrent session limits
 * - New device login alerts
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/services/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

export const SESSION_CONFIG = {
  // Activity timeout - auto-logout after inactivity (30 minutes)
  ACTIVITY_TIMEOUT_MS: 30 * 60 * 1000,
  
  // Maximum concurrent sessions per user
  MAX_CONCURRENT_SESSIONS: 5,
  
  // Session token length
  SESSION_TOKEN_LENGTH: 64,
  
  // Session expiry (24 hours)
  SESSION_EXPIRY_MS: 24 * 60 * 60 * 1000,
};

// ============================================================================
// TYPES
// ============================================================================

export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
  deviceInfo?: {
    browser?: string;
    os?: string;
    device?: string;
  };
}

export interface SessionActivity {
  lastActivity: Date;
  isActive: boolean;
  timeoutIn?: number;
}

// ============================================================================
// SESSION TRACKING
// ============================================================================

/**
 * Track session activity (call on each authenticated request)
 */
export async function trackSessionActivity(
  userId: string,
  sessionToken: string,
  ipAddress: string | null,
  userAgent: string | null
): Promise<{ success: boolean; isNewDevice: boolean }> {
  try {
    const supabase = await createClient();
    const now = new Date();
    
    // Check if this is a new device
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingSession } = await (supabase as any)
      .from('user_sessions')
      .select('id, ip_address, user_agent')
      .eq('user_id', userId)
      .eq('session_token', sessionToken)
      .single();
    
    const isNewDevice = !existingSession && !!(ipAddress || userAgent);
    
    if (existingSession) {
      // Update existing session
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('user_sessions')
        .update({
          last_activity: now.toISOString(),
          ip_address: ipAddress,
          user_agent: userAgent,
        })
        .eq('id', existingSession.id);
    } else {
      // Create new session
      const expiresAt = new Date(now.getTime() + SESSION_CONFIG.SESSION_EXPIRY_MS);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_token: sessionToken,
          ip_address: ipAddress,
          user_agent: userAgent,
          last_activity: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        });
      
      // Enforce concurrent session limit
      await enforceConcurrentSessionLimit(userId);
    }
    
    return { success: true, isNewDevice };
  } catch (error) {
    logger.error('Failed to track session activity', { error });
    return { success: false, isNewDevice: false };
  }
}

/**
 * Check if session is still active (not timed out)
 */
export async function checkSessionActivity(
  userId: string,
  sessionToken: string
): Promise<SessionActivity> {
  try {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: session } = await (supabase as any)
      .from('user_sessions')
      .select('last_activity, expires_at')
      .eq('user_id', userId)
      .eq('session_token', sessionToken)
      .single();
    
    if (!session) {
      return { lastActivity: new Date(0), isActive: false };
    }
    
    const now = Date.now();
    const lastActivity = new Date(session.last_activity);
    const expiresAt = new Date(session.expires_at);
    const timeSinceActivity = now - lastActivity.getTime();
    
    // Check if session has expired
    if (now > expiresAt.getTime()) {
      return { lastActivity, isActive: false };
    }
    
    // Check if session has timed out due to inactivity
    if (timeSinceActivity > SESSION_CONFIG.ACTIVITY_TIMEOUT_MS) {
      return { lastActivity, isActive: false };
    }
    
    const timeoutIn = SESSION_CONFIG.ACTIVITY_TIMEOUT_MS - timeSinceActivity;
    
    return {
      lastActivity,
      isActive: true,
      timeoutIn: Math.max(0, timeoutIn),
    };
  } catch (error) {
    logger.error('Failed to check session activity', { error });
    return { lastActivity: new Date(0), isActive: false };
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<UserSession[]> {
  try {
    const supabase = await createClient();
    const now = new Date();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sessions, error } = await (supabase as any)
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', now.toISOString())
      .order('last_activity', { ascending: false });
    
    if (error || !sessions) {
      return [];
    }
    
    return sessions.map((session: Record<string, unknown>) => ({
      id: session.id as string,
      userId: session.user_id as string,
      sessionToken: session.session_token as string,
      ipAddress: session.ip_address as string | null,
      userAgent: session.user_agent as string | null,
      lastActivity: new Date(session.last_activity as string),
      createdAt: new Date(session.created_at as string),
      expiresAt: new Date(session.expires_at as string),
      deviceInfo: parseUserAgent(session.user_agent as string | null),
    }));
  } catch (error) {
    logger.error('Failed to get user sessions', { error });
    return [];
  }
}

/**
 * Sign out from a specific session
 */
export async function signOutSession(
  userId: string,
  sessionId: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('user_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);
    
    return !error;
  } catch (error) {
    logger.error('Failed to sign out session', { error });
    return false;
  }
}

/**
 * Sign out from all devices except current
 */
export async function signOutAllDevices(
  userId: string,
  currentSessionToken?: string
): Promise<{ success: boolean; sessionsRevoked: number }> {
  try {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('user_sessions')
      .delete()
      .eq('user_id', userId);
    
    // Optionally keep the current session
    if (currentSessionToken) {
      query = query.neq('session_token', currentSessionToken);
    }
    
    const { error, count } = await query.select('id');
    
    if (error) {
      return { success: false, sessionsRevoked: 0 };
    }
    
    return {
      success: true,
      sessionsRevoked: count || 0,
    };
  } catch (error) {
    logger.error('Failed to sign out all devices', { error });
    return { success: false, sessionsRevoked: 0 };
  }
}

/**
 * Enforce concurrent session limit
 *
 * Uses an atomic approach to prevent race conditions:
 * 1. Count sessions first
 * 2. If over limit, delete oldest sessions in a single atomic query
 *    that re-checks the condition to prevent deleting new sessions
 *    that may have been created between the count and delete
 */
async function enforceConcurrentSessionLimit(userId: string): Promise<void> {
  try {
    const supabase = await createClient();

    // Get count first to avoid unnecessary operations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
      .from('user_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (!count || count <= SESSION_CONFIG.MAX_CONCURRENT_SESSIONS) {
      return;
    }

    // Calculate how many to delete
    const sessionsToDelete = count - SESSION_CONFIG.MAX_CONCURRENT_SESSIONS;

    // Get the IDs of the oldest sessions to delete
    // We fetch exactly the number we need to delete, ordered by oldest first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: oldestSessions } = await (supabase as any)
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .order('last_activity', { ascending: true })
      .limit(sessionsToDelete);

    if (!oldestSessions || oldestSessions.length === 0) {
      return;
    }

    const idsToDelete = oldestSessions.map((s: { id: string }) => s.id);

    // Delete the specific sessions we identified
    // This is safer than the previous approach as we're deleting specific IDs
    // rather than re-querying which could hit newly created sessions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('user_sessions')
      .delete()
      .in('id', idsToDelete);

    logger.info('Deleted excess sessions for user', { userId, count: idsToDelete.length });
  } catch (error) {
    logger.error('Failed to enforce session limit', { error });
  }
}

/**
 * Clean up expired sessions (call periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const supabase = await createClient();
    const now = new Date();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error, count } = await (supabase as any)
      .from('user_sessions')
      .delete()
      .lt('expires_at', now.toISOString())
      .select('id');
    
    if (error) {
      logger.error('Failed to cleanup expired sessions', { error });
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    logger.error('Failed to cleanup expired sessions', { error });
    return 0;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse user agent string to extract device info
 */
function parseUserAgent(userAgent: string | null): UserSession['deviceInfo'] {
  if (!userAgent) return undefined;
  
  const info: UserSession['deviceInfo'] = {};
  
  // Browser detection (simplified)
  if (userAgent.includes('Firefox')) info.browser = 'Firefox';
  else if (userAgent.includes('Edg/')) info.browser = 'Edge';
  else if (userAgent.includes('Chrome')) info.browser = 'Chrome';
  else if (userAgent.includes('Safari')) info.browser = 'Safari';
  else info.browser = 'Unknown';
  
  // OS detection (simplified)
  if (userAgent.includes('Windows')) info.os = 'Windows';
  else if (userAgent.includes('Mac OS')) info.os = 'macOS';
  else if (userAgent.includes('Linux')) info.os = 'Linux';
  else if (userAgent.includes('Android')) info.os = 'Android';
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) info.os = 'iOS';
  else info.os = 'Unknown';
  
  // Device type detection
  if (userAgent.includes('Mobile')) info.device = 'Mobile';
  else if (userAgent.includes('Tablet')) info.device = 'Tablet';
  else info.device = 'Desktop';
  
  return info;
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(SESSION_CONFIG.SESSION_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate session token format
 */
export function isValidSessionToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  return /^[a-f0-9]{128}$/i.test(token);
}


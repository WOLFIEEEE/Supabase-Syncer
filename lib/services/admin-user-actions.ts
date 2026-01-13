/**
 * Admin User Actions Service
 * 
 * Provides admin operations for user management:
 * - Ban/unban users
 * - Impersonate users
 * - Force logout
 * - View user details
 */

import { createClient } from '@/lib/supabase/server';
import { supabaseConnectionStore } from '@/lib/db/supabase-store';
import { supabaseSyncJobStore } from '@/lib/db/supabase-store';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface UserDetails {
  userId: string;
  email?: string;
  connectionCount: number;
  syncJobCount: number;
  lastActivity?: string;
  isBanned: boolean;
  connections: Array<{
    id: string;
    name: string;
    environment: string;
    createdAt: string;
  }>;
  recentSyncJobs: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
}

export interface BanUserResult {
  success: boolean;
  banned: boolean;
  error?: string;
}

interface UserSettingsRow {
  id?: string;
  user_id: string;
  settings: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

interface UserSessionRow {
  id?: string;
  user_id: string;
  last_activity: string;
}

// ============================================================================
// USER DETAILS
// ============================================================================

/**
 * Get detailed information about a user
 */
export async function getUserDetails(userId: string): Promise<UserDetails | null> {
  try {
    const supabase = await createClient() as SupabaseClient;

    // Get user connections
    const connections = await supabaseConnectionStore.getAll(userId);
    
    // Get user sync jobs
    const syncJobs = await supabaseSyncJobStore.getAll(userId, 10, 0);

    // Get user sessions for last activity
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('last_activity')
      .eq('user_id', userId)
      .order('last_activity', { ascending: false })
      .limit(1) as { data: UserSessionRow[] | null };

    // Check if user is banned (using user_settings table)
    const { data: settingsData } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .single() as { data: { settings: Record<string, unknown> } | null };

    const settings = settingsData?.settings;
    const isBanned = settings && 
      typeof settings === 'object' &&
      'banned' in settings &&
      settings.banned === true;

    const lastActivity = sessions && sessions.length > 0 
      ? sessions[0].last_activity 
      : undefined;

    return {
      userId,
      connectionCount: connections.length,
      syncJobCount: syncJobs.length,
      lastActivity,
      isBanned: !!isBanned,
      connections: connections.map(c => ({
        id: c.id,
        name: c.name,
        environment: c.environment,
        createdAt: c.created_at,
      })),
      recentSyncJobs: syncJobs.map(j => ({
        id: j.id,
        status: j.status,
        createdAt: j.created_at,
      })),
    };
  } catch (error) {
    console.error('[ADMIN_USER_ACTIONS] Error getting user details:', error);
    return null;
  }
}

// ============================================================================
// BAN/UNBAN
// ============================================================================

/**
 * Ban or unban a user
 */
export async function banUser(
  userId: string,
  banned: boolean,
  reason?: string
): Promise<BanUserResult> {
  try {
    const supabase = await createClient() as SupabaseClient;

    // Get or create user settings
    const { data: existing } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .single() as { data: { settings: Record<string, unknown> } | null };

    const currentSettings = existing?.settings || {};
    const updatedSettings: Record<string, unknown> = {
      ...currentSettings,
      banned,
    };
    
    if (banned) {
      updatedSettings.bannedAt = new Date().toISOString();
      if (reason) updatedSettings.banReason = reason;
    } else {
      updatedSettings.unbannedAt = new Date().toISOString();
      delete updatedSettings.bannedAt;
      delete updatedSettings.banReason;
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
      } as UserSettingsRow, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('[ADMIN_USER_ACTIONS] Error banning user:', error);
      return {
        success: false,
        banned: false,
        error: error.message,
      };
    }

    return {
      success: true,
      banned,
    };
  } catch (error) {
    console.error('[ADMIN_USER_ACTIONS] Error in banUser:', error);
    return {
      success: false,
      banned: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if a user is banned
 */
export async function isUserBanned(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient() as SupabaseClient;
    
    const { data: settingsData } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .single() as { data: { settings: Record<string, unknown> } | null };

    if (!settingsData?.settings) return false;

    return settingsData.settings.banned === true;
  } catch {
    return false;
  }
}

// ============================================================================
// FORCE LOGOUT
// ============================================================================

/**
 * Force logout a user by deleting all their sessions
 */
export async function forceLogout(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient() as SupabaseClient;

    // Delete all user sessions
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[ADMIN_USER_ACTIONS] Error forcing logout:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ADMIN_USER_ACTIONS] Error in forceLogout:', error);
    return false;
  }
}

// ============================================================================
// IMPERSONATION
// ============================================================================

/**
 * Create an impersonation token for a user
 * Note: This is a simplified version - in production, you'd want more security
 */
export async function createImpersonationToken(userId: string): Promise<string | null> {
  try {
    const supabase = await createClient() as SupabaseClient;

    // Create a temporary session for impersonation
    // In production, you'd want to use Supabase admin API or a more secure method
    // For now, we'll return a token that can be used to identify the impersonation
    
    const token = `impersonate_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get existing settings first
    const { data: existing } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .single() as { data: { settings: Record<string, unknown> } | null };

    const currentSettings = existing?.settings || {};
    const updatedSettings: Record<string, unknown> = {
      ...currentSettings,
      impersonationToken: token,
      impersonationCreatedAt: new Date().toISOString(),
    };

    // Store impersonation record
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
      } as UserSettingsRow, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('[ADMIN_USER_ACTIONS] Error creating impersonation token:', error);
      return null;
    }

    return token;
  } catch (error) {
    console.error('[ADMIN_USER_ACTIONS] Error in createImpersonationToken:', error);
    return null;
  }
}

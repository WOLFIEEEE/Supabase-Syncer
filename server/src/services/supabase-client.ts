/**
 * Supabase Client Service
 * 
 * Provides Supabase client for backend to query sync jobs, connections, etc.
 * Uses service role key for admin operations (if available) or anon key for user-scoped queries.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      throw new Error('Supabase configuration is missing');
    }
    
    supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  
  return supabaseClient;
}

/**
 * Get connection by ID (user-scoped)
 */
export async function getConnectionById(
  connectionId: string,
  userId: string
): Promise<{
  id: string;
  user_id: string;
  name: string;
  encrypted_url: string;
  environment: string;
} | null> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error({ error, connectionId, userId }, 'Error fetching connection');
      throw error;
    }
    
    return data as any;
  } catch (error) {
    logger.error({ error, connectionId, userId }, 'Failed to get connection');
    return null;
  }
}

/**
 * Get sync job by ID (user-scoped)
 */
export async function getSyncJobById(
  jobId: string,
  userId: string
): Promise<{
  id: string;
  user_id: string;
  source_connection_id: string;
  target_connection_id: string;
  direction: 'one_way' | 'two_way';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  tables_config: unknown;
  progress: unknown;
  checkpoint: unknown;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
} | null> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('sync_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      logger.error({ error, jobId, userId }, 'Error fetching sync job');
      throw error;
    }
    
    return data as any;
  } catch (error) {
    logger.error({ error, jobId, userId }, 'Failed to get sync job');
    return null;
  }
}

/**
 * Create sync job
 */
export async function createSyncJob(
  userId: string,
  data: {
    source_connection_id: string;
    target_connection_id: string;
    direction: 'one_way' | 'two_way';
    tables_config: unknown;
  }
): Promise<{
  id: string;
  user_id: string;
  source_connection_id: string;
  target_connection_id: string;
  direction: 'one_way' | 'two_way';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  tables_config: unknown;
  progress: unknown;
  checkpoint: unknown;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}> {
  try {
    const supabase = getSupabaseClient();
    
    const { data: job, error } = await supabase
      .from('sync_jobs')
      .insert({
        user_id: userId,
        ...data,
        status: 'pending',
      })
      .select()
      .single();
    
    if (error) {
      logger.error({ error, userId }, 'Error creating sync job');
      throw error;
    }
    
    return job as any;
  } catch (error) {
    logger.error({ error, userId }, 'Failed to create sync job');
    throw error;
  }
}

/**
 * Update sync job
 */
export async function updateSyncJob(
  jobId: string,
  userId: string,
  updates: {
    status?: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
    progress?: unknown;
    checkpoint?: unknown;
    started_at?: string | null;
    completed_at?: string | null;
  }
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('sync_jobs')
      .update(updates)
      .eq('id', jobId)
      .eq('user_id', userId);
    
    if (error) {
      logger.error({ error, jobId, userId }, 'Error updating sync job');
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error({ error, jobId, userId }, 'Failed to update sync job');
    return false;
  }
}

/**
 * Add sync log entry
 */
export async function addSyncLog(
  jobId: string,
  level: 'info' | 'warn' | 'error',
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('sync_logs')
      .insert({
        sync_job_id: jobId,
        level,
        message,
        metadata: metadata || null,
      });
    
    if (error) {
      logger.error({ error, jobId }, 'Error adding sync log');
    }
  } catch (error) {
    logger.error({ error, jobId }, 'Failed to add sync log');
  }
}

/**
 * Get all connections with keep_alive enabled (for service/cron use)
 * This is used by the backend keep-alive scheduler
 */
export async function getKeepAliveConnections(): Promise<{
  id: string;
  name: string;
  encrypted_url: string;
  keep_alive: boolean;
  last_pinged_at: string | null;
}[]> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('connections')
      .select('id, name, encrypted_url, keep_alive, last_pinged_at')
      .eq('keep_alive', true);
    
    if (error) {
      logger.error({ error }, 'Error fetching keep-alive connections');
      return [];
    }
    
    return (data || []) as any;
  } catch (error) {
    logger.error({ error }, 'Failed to get keep-alive connections');
    return [];
  }
}

/**
 * Update last_pinged_at for a connection
 */
export async function updateConnectionLastPinged(connectionId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const timestamp = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('connections')
      .update({ last_pinged_at: timestamp })
      .eq('id', connectionId)
      .select('id, last_pinged_at')
      .single();
    
    if (error) {
      logger.warn({ error, connectionId, timestamp }, 'Failed to update last_pinged_at');
      return false;
    }
    
    // Verify the update was successful
    if (data && data.last_pinged_at) {
      logger.debug({ connectionId, lastPingedAt: data.last_pinged_at }, 
        'Successfully updated last_pinged_at');
      return true;
    } else {
      logger.warn({ connectionId }, 'Update returned no data - update may have failed');
      return false;
    }
  } catch (error) {
    logger.warn({ error, connectionId }, 'Exception while updating last_pinged_at');
    return false;
  }
}


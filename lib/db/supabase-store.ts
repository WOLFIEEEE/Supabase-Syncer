/**
 * Supabase Storage Layer
 * 
 * Persists connections, sync jobs, and logs to Supabase database.
 * Uses Row Level Security (RLS) for user isolation.
 */

import { createClient } from '@/lib/supabase/server';
import type { 
  Connection, 
  SyncJob, 
  SyncLog, 
  UserSettings,
  Json
} from '@/types/supabase';

// ============================================
// Connection Store (Supabase)
// ============================================

export const supabaseConnectionStore = {
  async getAll(userId: string): Promise<Connection[]> {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching connections:', error);
      throw new Error(`Failed to fetch connections: ${error.message}`);
    }
    
    return data || [];
  },
  
  async getById(id: string, userId: string): Promise<Connection | null> {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('connections')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching connection:', error);
      throw new Error(`Failed to fetch connection: ${error.message}`);
    }
    
    return data;
  },
  
  async create(userId: string, data: {
    name: string;
    encryptedUrl: string;
    environment: 'production' | 'development';
  }): Promise<Connection> {
    const supabase = await createClient();
    
    const insertData = {
      user_id: userId,
      name: data.name,
      encrypted_url: data.encryptedUrl,
      environment: data.environment,
    };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: connection, error } = await (supabase as any)
      .from('connections')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating connection:', error);
      throw new Error(`Failed to create connection: ${error.message}`);
    }
    
    return connection;
  },
  
  async update(id: string, userId: string, data: Partial<{
    name: string;
    encryptedUrl: string;
    environment: 'production' | 'development';
  }>): Promise<Connection | null> {
    const supabase = await createClient();
    
    const updateData = {
      ...(data.name && { name: data.name }),
      ...(data.encryptedUrl && { encrypted_url: data.encryptedUrl }),
      ...(data.environment && { environment: data.environment }),
      updated_at: new Date().toISOString(),
    };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: connection, error } = await (supabase as any)
      .from('connections')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error updating connection:', error);
      throw new Error(`Failed to update connection: ${error.message}`);
    }
    
    return connection;
  },
  
  async delete(id: string, userId: string): Promise<boolean> {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error, count } = await (supabase as any)
      .from('connections')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting connection:', error);
      return false;
    }
    
    return (count ?? 0) > 0;
  },
  
  async getSystemStats(): Promise<{ total: number; production: number; development: number }> {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('connections')
      .select('environment');
    
    if (error) {
      console.error('Error fetching stats:', error);
      return { total: 0, production: 0, development: 0 };
    }
    
    const all = data || [];
    return {
      total: all.length,
      production: all.filter((c: { environment: string }) => c.environment === 'production').length,
      development: all.filter((c: { environment: string }) => c.environment === 'development').length,
    };
  },
  
  // ============================================
  // Keep Alive Methods (for cron job - no user context)
  // ============================================
  
  /**
   * Get all connections for service-level operations (cron job)
   * Note: No user filtering - use with caution
   */
  async getAllForService(): Promise<(Connection & { keepAlive: boolean; lastPingedAt: Date | null })[]> {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('connections')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all connections:', error);
      return [];
    }
    
    return (data || []).map((c: Record<string, unknown>) => ({
      ...c,
      keepAlive: c.keep_alive === true,
      lastPingedAt: c.last_pinged_at ? new Date(c.last_pinged_at as string) : null,
    }));
  },
  
  /**
   * Get a connection by ID for service-level operations (cron job)
   * Note: No user filtering - use with caution
   */
  async getByIdForService(id: string): Promise<(Connection & { keepAlive: boolean; lastPingedAt: Date | null }) | null> {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('connections')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching connection:', error);
      return null;
    }
    
    const c = data as Record<string, unknown>;
    return {
      ...data,
      keepAlive: c.keep_alive === true,
      lastPingedAt: c.last_pinged_at ? new Date(c.last_pinged_at as string) : null,
    };
  },
  
  /**
   * Update keep_alive setting for a connection
   */
  async updateKeepAlive(id: string, userId: string, keepAlive: boolean): Promise<Connection | null> {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: connection, error } = await (supabase as any)
      .from('connections')
      .update({
        keep_alive: keepAlive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating keep_alive:', error);
      throw new Error(`Failed to update keep_alive: ${error.message}`);
    }
    
    return connection;
  },
  
  /**
   * Update last_pinged_at timestamp (for cron job)
   */
  async updateLastPinged(id: string): Promise<void> {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('connections')
      .update({
        last_pinged_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating last_pinged_at:', error);
    }
  },
};

// ============================================
// Sync Job Store (Supabase)
// ============================================

export const supabaseSyncJobStore = {
  async getAll(userId: string, limit = 50, offset = 0): Promise<SyncJob[]> {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('sync_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching sync jobs:', error);
      throw new Error(`Failed to fetch sync jobs: ${error.message}`);
    }
    
    return data || [];
  },
  
  async getById(id: string, userId: string): Promise<SyncJob | null> {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('sync_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching sync job:', error);
      throw new Error(`Failed to fetch sync job: ${error.message}`);
    }
    
    return data;
  },
  
  async create(userId: string, data: {
    sourceConnectionId: string;
    targetConnectionId: string;
    direction: 'one_way' | 'two_way';
    tablesConfig: { tableName: string; enabled: boolean; conflictStrategy?: string }[];
  }): Promise<SyncJob> {
    const supabase = await createClient();
    
    const insertData = {
      user_id: userId,
      source_connection_id: data.sourceConnectionId,
      target_connection_id: data.targetConnectionId,
      direction: data.direction,
      tables_config: data.tablesConfig as unknown as Json,
      status: 'pending',
    };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: job, error } = await (supabase as any)
      .from('sync_jobs')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating sync job:', error);
      throw new Error(`Failed to create sync job: ${error.message}`);
    }
    
    return job;
  },
  
  async update(id: string, userId: string, data: Partial<{
    status: SyncJob['status'];
    progress: Json;
    checkpoint: Json;
    startedAt: string;
    completedAt: string;
  }>): Promise<SyncJob | null> {
    const supabase = await createClient();
    
    const updateData = {
      ...(data.status && { status: data.status }),
      ...(data.progress !== undefined && { progress: data.progress }),
      ...(data.checkpoint !== undefined && { checkpoint: data.checkpoint }),
      ...(data.startedAt && { started_at: data.startedAt }),
      ...(data.completedAt && { completed_at: data.completedAt }),
    };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: job, error } = await (supabase as any)
      .from('sync_jobs')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error updating sync job:', error);
      throw new Error(`Failed to update sync job: ${error.message}`);
    }
    
    return job;
  },
  
  async delete(id: string, userId: string): Promise<boolean> {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error, count } = await (supabase as any)
      .from('sync_jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting sync job:', error);
      return false;
    }
    
    return (count ?? 0) > 0;
  },
};

// ============================================
// Sync Log Store (Supabase)
// ============================================

export const supabaseSyncLogStore = {
  async getByJobId(jobId: string, limit = 1000): Promise<SyncLog[]> {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('sync_logs')
      .select('*')
      .eq('sync_job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching sync logs:', error);
      return [];
    }
    
    return data || [];
  },
  
  async add(jobId: string, level: 'info' | 'warn' | 'error', message: string, metadata?: Record<string, unknown>): Promise<SyncLog | null> {
    const supabase = await createClient();
    
    const insertData = {
      sync_job_id: jobId,
      level,
      message,
      metadata: metadata as Json || null,
    };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('sync_logs')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding sync log:', error);
      return null;
    }
    
    return data;
  },
};

// ============================================
// User Settings Store (Supabase)
// ============================================

export const supabaseUserSettingsStore = {
  async get(userId: string): Promise<UserSettings | null> {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching user settings:', error);
      return null;
    }
    
    return data;
  },
  
  async upsert(userId: string, settings: Record<string, unknown>): Promise<UserSettings | null> {
    const supabase = await createClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('user_settings')
      .upsert({
        user_id: userId,
        settings: settings as Json,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error upserting user settings:', error);
      return null;
    }
    
    return data;
  },
};

// ============================================
// Helper Functions
// ============================================

export async function getJobWithConnections(job: SyncJob, userId: string) {
  const [sourceConnection, targetConnection] = await Promise.all([
    supabaseConnectionStore.getById(job.source_connection_id, userId),
    supabaseConnectionStore.getById(job.target_connection_id, userId),
  ]);
  
  return {
    ...job,
    // Convert snake_case to camelCase for consistency
    sourceConnectionId: job.source_connection_id,
    targetConnectionId: job.target_connection_id,
    tablesConfig: job.tables_config,
    startedAt: job.started_at,
    completedAt: job.completed_at,
    createdAt: job.created_at,
    sourceConnection: sourceConnection ? {
      id: sourceConnection.id,
      name: sourceConnection.name,
      environment: sourceConnection.environment,
    } : undefined,
    targetConnection: targetConnection ? {
      id: targetConnection.id,
      name: targetConnection.name,
      environment: targetConnection.environment,
    } : undefined,
  };
}

// ============================================
// Check if tables exist
// ============================================

export async function checkTablesExist(): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Try to query the connections table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('connections')
      .select('id')
      .limit(1);
    
    // If error is about relation not existing, tables don't exist
    if (error?.message?.includes('relation') && error?.message?.includes('does not exist')) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

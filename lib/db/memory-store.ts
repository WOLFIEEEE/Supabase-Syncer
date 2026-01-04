/**
 * In-memory store for connections and sync jobs
 * This allows the app to work without its own database
 * Data is lost on restart - for production, use Supabase tables with RLS
 * 
 * All data is now scoped by user_id for multi-tenant support
 */

import { v4 as uuidv4 } from 'uuid';

// Types
export interface StoredConnection {
  id: string;
  userId: string;
  name: string;
  encryptedUrl: string;
  environment: 'production' | 'development';
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredSyncJob {
  id: string;
  userId: string;
  sourceConnectionId: string;
  targetConnectionId: string;
  direction: 'one_way' | 'two_way';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  tablesConfig: { tableName: string; enabled: boolean; conflictStrategy?: string }[];
  progress: {
    totalTables: number;
    completedTables: number;
    currentTable: string | null;
    totalRows: number;
    processedRows: number;
    insertedRows: number;
    updatedRows: number;
    skippedRows: number;
    errors: number;
  } | null;
  checkpoint: {
    lastTable: string;
    lastRowId: string;
    lastUpdatedAt: string;
    processedTables: string[];
  } | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface StoredSyncLog {
  id: string;
  syncJobId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface UserSettings {
  id: string;
  userId: string;
  settings: {
    confirmProductionActions: boolean;
    showRowCounts: boolean;
    defaultSyncMode: 'one_way' | 'two_way';
    defaultConflictStrategy: string;
    autoValidateSchema: boolean;
    darkMode: boolean;
    compactView: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// In-memory stores
const connections: Map<string, StoredConnection> = new Map();
const syncJobs: Map<string, StoredSyncJob> = new Map();
const syncLogs: Map<string, StoredSyncLog[]> = new Map();
const userSettings: Map<string, UserSettings> = new Map();

// Connection operations - now filtered by userId
export const connectionStore = {
  getAll: (userId: string): StoredConnection[] => {
    return Array.from(connections.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
  
  // System-level stats (no user filtering) - for status endpoint
  getSystemStats: (): { total: number; production: number; development: number } => {
    const all = Array.from(connections.values());
    return {
      total: all.length,
      production: all.filter(c => c.environment === 'production').length,
      development: all.filter(c => c.environment === 'development').length,
    };
  },
  
  getById: (id: string, userId: string): StoredConnection | undefined => {
    const connection = connections.get(id);
    // Only return if the connection belongs to the user
    if (connection && connection.userId === userId) {
      return connection;
    }
    return undefined;
  },
  
  create: (userId: string, data: Omit<StoredConnection, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): StoredConnection => {
    const connection: StoredConnection = {
      ...data,
      id: uuidv4(),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    connections.set(connection.id, connection);
    return connection;
  },
  
  update: (id: string, userId: string, data: Partial<StoredConnection>): StoredConnection | undefined => {
    const existing = connections.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const updated = { ...existing, ...data, userId, updatedAt: new Date() };
    connections.set(id, updated);
    return updated;
  },
  
  delete: (id: string, userId: string): boolean => {
    const existing = connections.get(id);
    if (!existing || existing.userId !== userId) return false;
    return connections.delete(id);
  },
};

// Sync job operations - now filtered by userId
export const syncJobStore = {
  getAll: (userId: string, limit = 50, offset = 0): StoredSyncJob[] => {
    return Array.from(syncJobs.values())
      .filter(j => j.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  },
  
  getById: (id: string, userId: string): StoredSyncJob | undefined => {
    const job = syncJobs.get(id);
    if (job && job.userId === userId) {
      return job;
    }
    return undefined;
  },
  
  // For internal use (e.g., worker) - no user check
  getByIdInternal: (id: string): StoredSyncJob | undefined => {
    return syncJobs.get(id);
  },
  
  create: (userId: string, data: Omit<StoredSyncJob, 'id' | 'userId' | 'createdAt' | 'status' | 'progress' | 'checkpoint' | 'startedAt' | 'completedAt'>): StoredSyncJob => {
    const job: StoredSyncJob = {
      ...data,
      id: uuidv4(),
      userId,
      status: 'pending',
      progress: null,
      checkpoint: null,
      startedAt: null,
      completedAt: null,
      createdAt: new Date(),
    };
    syncJobs.set(job.id, job);
    syncLogs.set(job.id, []);
    return job;
  },
  
  update: (id: string, userId: string, data: Partial<StoredSyncJob>): StoredSyncJob | undefined => {
    const existing = syncJobs.get(id);
    if (!existing || existing.userId !== userId) return undefined;
    
    const updated = { ...existing, ...data };
    syncJobs.set(id, updated);
    return updated;
  },
  
  // For internal use (e.g., worker) - no user check
  updateInternal: (id: string, data: Partial<StoredSyncJob>): StoredSyncJob | undefined => {
    const existing = syncJobs.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...data };
    syncJobs.set(id, updated);
    return updated;
  },
  
  delete: (id: string, userId: string): boolean => {
    const existing = syncJobs.get(id);
    if (!existing || existing.userId !== userId) return false;
    syncLogs.delete(id);
    return syncJobs.delete(id);
  },
};

// Sync log operations (no direct user filtering - tied to job)
export const syncLogStore = {
  getByJobId: (jobId: string, limit = 100): StoredSyncLog[] => {
    const logs = syncLogs.get(jobId) || [];
    return logs.slice(-limit).reverse();
  },
  
  add: (jobId: string, level: 'info' | 'warn' | 'error', message: string, metadata?: Record<string, unknown>): StoredSyncLog => {
    const log: StoredSyncLog = {
      id: uuidv4(),
      syncJobId: jobId,
      level,
      message,
      metadata: metadata || null,
      createdAt: new Date(),
    };
    
    const logs = syncLogs.get(jobId) || [];
    logs.push(log);
    
    // Keep only last 1000 logs per job
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }
    
    syncLogs.set(jobId, logs);
    return log;
  },
  
  clear: (jobId: string): void => {
    syncLogs.delete(jobId);
  },
};

// User settings operations
export const userSettingsStore = {
  get: (userId: string): UserSettings | undefined => {
    return userSettings.get(userId);
  },
  
  upsert: (userId: string, settings: Partial<UserSettings['settings']>): UserSettings => {
    const existing = userSettings.get(userId);
    
    const defaultSettings: UserSettings['settings'] = {
      confirmProductionActions: true,
      showRowCounts: true,
      defaultSyncMode: 'one_way',
      defaultConflictStrategy: 'source_wins',
      autoValidateSchema: true,
      darkMode: true,
      compactView: false,
    };
    
    if (existing) {
      const updated: UserSettings = {
        ...existing,
        settings: { ...existing.settings, ...settings },
        updatedAt: new Date(),
      };
      userSettings.set(userId, updated);
      return updated;
    }
    
    const newSettings: UserSettings = {
      id: uuidv4(),
      userId,
      settings: { ...defaultSettings, ...settings },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    userSettings.set(userId, newSettings);
    return newSettings;
  },
};

// Helper to get connection with source/target info for jobs
export const getJobWithConnections = (job: StoredSyncJob, userId: string) => {
  const sourceConnection = connectionStore.getById(job.sourceConnectionId, userId);
  const targetConnection = connectionStore.getById(job.targetConnectionId, userId);
  
  return {
    ...job,
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
};

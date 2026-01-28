/**
 * Backup Service
 * 
 * Provides file-based backup/restore functionality for sync operations.
 * Stores backups in Supabase Storage for rollback capability.
 */

import { createDrizzleClient, type DrizzleConnection } from './drizzle-factory';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/services/logger';
import {
  isValidTableName,
  validateTableNames,
  escapeIdentifier as secureEscapeIdentifier,
  escapeLiteral,
  SecurityError,
} from './security-utils';

// ============================================================================
// TYPES
// ============================================================================

export interface BackupMetadata {
  id: string;
  syncJobId: string;
  userId: string;
  targetConnectionId: string;
  tables: string[];
  backupPath: string;
  sizeBytes: number;
  rowCount: number;
  status: 'creating' | 'completed' | 'restoring' | 'restored' | 'failed';
  createdAt: Date;
  restoredAt?: Date;
  error?: string;
}

export interface CreateBackupOptions {
  syncJobId: string;
  userId: string;
  targetConnectionId: string;
  targetUrl: string;
  tables: string[];
  onProgress?: (progress: BackupProgress) => void;
  onLog?: (level: 'info' | 'warn' | 'error', message: string) => void;
}

export interface BackupProgress {
  currentTable: string;
  completedTables: number;
  totalTables: number;
  rowsExported: number;
  bytesWritten: number;
}

export interface RestoreOptions {
  backupId: string;
  targetUrl: string;
  onProgress?: (progress: RestoreProgress) => void;
  onLog?: (level: 'info' | 'warn' | 'error', message: string) => void;
}

export interface RestoreProgress {
  currentTable: string;
  completedTables: number;
  totalTables: number;
  rowsRestored: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const BACKUP_CONFIG = {
  storageBucket: 'sync-backups',
  maxBackupAgeDays: 7,
  batchSize: 1000,
  compressionEnabled: false, // Can enable gzip later
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique backup ID
 */
function generateBackupId(): string {
  return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate backup file path
 */
function getBackupPath(userId: string, syncJobId: string, backupId: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `${userId}/${date}/${syncJobId}/${backupId}.sql`;
}

/**
 * Escape SQL string value
 */
function escapeSqlValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (typeof value === 'number') {
    return String(value);
  }
  
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  
  if (typeof value === 'object') {
    // JSON/JSONB columns
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  
  // String value - escape single quotes
  return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * Escape SQL identifier (table/column names)
 * SECURITY: Uses the centralized security utility with validation
 */
function escapeIdentifier(name: string): string {
  return secureEscapeIdentifier(name);
}

// ============================================================================
// BACKUP METADATA STORAGE
// ============================================================================

// In-memory store for backup metadata (will be replaced with DB in production)
const backupStore = new Map<string, BackupMetadata>();

/**
 * Save backup metadata
 */
async function saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
  backupStore.set(metadata.id, metadata);
  
  // Also try to save to Supabase if available
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase.from('sync_backups').upsert({
        id: metadata.id,
        sync_job_id: metadata.syncJobId,
        user_id: metadata.userId,
        target_connection_id: metadata.targetConnectionId,
        tables: metadata.tables,
        backup_path: metadata.backupPath,
        size_bytes: metadata.sizeBytes,
        row_count: metadata.rowCount,
        status: metadata.status,
        created_at: metadata.createdAt.toISOString(),
        restored_at: metadata.restoredAt?.toISOString(),
        error: metadata.error,
      });
    }
  } catch (error) {
    // Log but don't fail - metadata is in memory
    logger.warn('Failed to save backup metadata to Supabase', { error });
  }
}

/**
 * Get backup metadata
 */
async function getBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
  // Check memory first
  const memoryMetadata = backupStore.get(backupId);
  if (memoryMetadata) {
    return memoryMetadata;
  }
  
  // Try Supabase
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('sync_backups')
        .select('*')
        .eq('id', backupId)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      return {
        id: data.id,
        syncJobId: data.sync_job_id,
        userId: data.user_id,
        targetConnectionId: data.target_connection_id,
        tables: data.tables,
        backupPath: data.backup_path,
        sizeBytes: data.size_bytes,
        rowCount: data.row_count,
        status: data.status,
        createdAt: new Date(data.created_at),
        restoredAt: data.restored_at ? new Date(data.restored_at) : undefined,
        error: data.error,
      };
    }
  } catch (error) {
    logger.warn('Failed to get backup metadata from Supabase', { error });
  }

  return null;
}

// ============================================================================
// BACKUP STORAGE
// ============================================================================

/**
 * Store backup content to Supabase Storage
 */
async function storeBackupContent(
  backupPath: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      // Fallback: store in memory for development
      logger.warn('Supabase not configured, storing backup in memory');
      backupContentStore.set(backupPath, content);
      return { success: true };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Upload to storage
    const { error } = await supabase.storage
      .from(BACKUP_CONFIG.storageBucket)
      .upload(backupPath, content, {
        contentType: 'text/plain',
        upsert: true,
      });
    
    if (error) {
      // Bucket might not exist, fallback to memory
      logger.warn('Storage upload failed, using memory fallback', { error: error.message });
      backupContentStore.set(backupPath, content);
      return { success: true };
    }
    
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Retrieve backup content from Supabase Storage
 */
async function retrieveBackupContent(
  backupPath: string
): Promise<{ content: string | null; error?: string }> {
  try {
    // Check memory first
    const memoryContent = backupContentStore.get(backupPath);
    if (memoryContent) {
      return { content: memoryContent };
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return { content: null, error: 'Supabase not configured' };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase.storage
      .from(BACKUP_CONFIG.storageBucket)
      .download(backupPath);
    
    if (error) {
      return { content: null, error: error.message };
    }
    
    const content = await data.text();
    return { content };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { content: null, error: message };
  }
}

// In-memory backup content store (fallback for development)
const backupContentStore = new Map<string, string>();

// ============================================================================
// TABLE EXPORT
// ============================================================================

/**
 * Export a table to SQL INSERT statements
 */
export async function exportTableToSQL(
  conn: DrizzleConnection,
  tableName: string,
  onProgress?: (rowCount: number) => void
): Promise<{ sql: string; rowCount: number }> {
  const statements: string[] = [];
  let totalRows = 0;
  let offset = 0;
  
  // Get column names
  const columnsResult = await conn.client`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
    ORDER BY ordinal_position
  `;
  
  const columns = columnsResult.map((r) => String(r.column_name));
  
  if (columns.length === 0) {
    return { sql: '', rowCount: 0 };
  }
  
  const columnList = columns.map(escapeIdentifier).join(', ');
  
  // Add table header comment
  statements.push(`-- Table: ${tableName}`);
  statements.push(`-- Backup created at: ${new Date().toISOString()}`);
  statements.push('');
  
  // Export rows in batches
  while (true) {
    const rows = await conn.client.unsafe(
      `SELECT * FROM ${escapeIdentifier(tableName)} ORDER BY id LIMIT ${BACKUP_CONFIG.batchSize} OFFSET ${offset}`
    );
    
    if (rows.length === 0) {
      break;
    }
    
    for (const row of rows) {
      const values = columns.map((col) => escapeSqlValue(row[col])).join(', ');
      statements.push(
        `INSERT INTO ${escapeIdentifier(tableName)} (${columnList}) VALUES (${values});`
      );
      totalRows++;
    }
    
    offset += BACKUP_CONFIG.batchSize;
    onProgress?.(totalRows);
    
    // Check if we got fewer rows than batch size (last batch)
    if (rows.length < BACKUP_CONFIG.batchSize) {
      break;
    }
  }
  
  return {
    sql: statements.join('\n'),
    rowCount: totalRows,
  };
}

// ============================================================================
// MAIN BACKUP FUNCTIONS
// ============================================================================

/**
 * Create a backup of specified tables before sync
 */
export async function createBackup(options: CreateBackupOptions): Promise<BackupMetadata> {
  const {
    syncJobId,
    userId,
    targetConnectionId,
    targetUrl,
    tables,
    onProgress,
    onLog,
  } = options;
  
  const backupId = generateBackupId();
  const backupPath = getBackupPath(userId, syncJobId, backupId);
  
  // Initialize metadata
  const metadata: BackupMetadata = {
    id: backupId,
    syncJobId,
    userId,
    targetConnectionId,
    tables,
    backupPath,
    sizeBytes: 0,
    rowCount: 0,
    status: 'creating',
    createdAt: new Date(),
  };
  
  await saveBackupMetadata(metadata);
  
  let conn: DrizzleConnection | null = null;
  
  try {
    onLog?.('info', `Creating backup for ${tables.length} tables`);
    
    conn = createDrizzleClient(targetUrl);
    
    const allStatements: string[] = [];
    let totalRows = 0;
    let completedTables = 0;
    
    // Add backup header
    allStatements.push('-- Supabase Syncer Backup');
    allStatements.push(`-- Backup ID: ${backupId}`);
    allStatements.push(`-- Sync Job ID: ${syncJobId}`);
    allStatements.push(`-- Created: ${new Date().toISOString()}`);
    allStatements.push(`-- Tables: ${tables.join(', ')}`);
    allStatements.push('');
    allStatements.push('BEGIN;');
    allStatements.push('');
    
    // Export each table
    for (const tableName of tables) {
      onLog?.('info', `Exporting table: ${tableName}`);
      
      onProgress?.({
        currentTable: tableName,
        completedTables,
        totalTables: tables.length,
        rowsExported: totalRows,
        bytesWritten: allStatements.join('\n').length,
      });
      
      // Delete existing data first (for restore)
      allStatements.push(`-- Delete existing data for ${tableName}`);
      allStatements.push(`DELETE FROM ${escapeIdentifier(tableName)};`);
      allStatements.push('');
      
      // Export table data
      const { sql, rowCount } = await exportTableToSQL(conn, tableName, (rows) => {
        onProgress?.({
          currentTable: tableName,
          completedTables,
          totalTables: tables.length,
          rowsExported: totalRows + rows,
          bytesWritten: allStatements.join('\n').length,
        });
      });
      
      if (sql) {
        allStatements.push(sql);
        allStatements.push('');
      }
      
      totalRows += rowCount;
      completedTables++;
      
      onLog?.('info', `Exported ${rowCount} rows from ${tableName}`);
    }
    
    // Add backup footer
    allStatements.push('COMMIT;');
    allStatements.push('');
    allStatements.push(`-- End of backup: ${backupId}`);
    
    const backupContent = allStatements.join('\n');
    
    // Store backup
    onLog?.('info', 'Storing backup...');
    
    const storeResult = await storeBackupContent(backupPath, backupContent);
    
    if (!storeResult.success) {
      throw new Error(`Failed to store backup: ${storeResult.error}`);
    }
    
    // Update metadata
    metadata.status = 'completed';
    metadata.rowCount = totalRows;
    metadata.sizeBytes = backupContent.length;
    
    await saveBackupMetadata(metadata);
    
    onLog?.('info', `Backup completed: ${totalRows} rows, ${(backupContent.length / 1024).toFixed(2)} KB`);
    
    return metadata;
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    metadata.status = 'failed';
    metadata.error = message;
    
    await saveBackupMetadata(metadata);
    
    onLog?.('error', `Backup failed: ${message}`);
    
    throw error;
    
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

/**
 * Restore a backup to the target database
 */
export async function restoreBackup(options: RestoreOptions): Promise<void> {
  const { backupId, targetUrl, onProgress, onLog } = options;
  
  onLog?.('info', `Starting restore for backup: ${backupId}`);
  
  // Get backup metadata
  const metadata = await getBackupMetadata(backupId);
  
  if (!metadata) {
    throw new Error(`Backup not found: ${backupId}`);
  }
  
  if (metadata.status !== 'completed') {
    throw new Error(`Cannot restore backup with status: ${metadata.status}`);
  }
  
  // Update status
  metadata.status = 'restoring';
  await saveBackupMetadata(metadata);
  
  let conn: DrizzleConnection | null = null;
  
  try {
    // Retrieve backup content
    onLog?.('info', 'Retrieving backup content...');
    
    const { content, error } = await retrieveBackupContent(metadata.backupPath);
    
    if (!content) {
      throw new Error(`Failed to retrieve backup: ${error}`);
    }
    
    onLog?.('info', `Backup content retrieved: ${(content.length / 1024).toFixed(2)} KB`);
    
    conn = createDrizzleClient(targetUrl);
    
    // Parse and execute SQL statements
    const statements = content
      .split('\n')
      .filter((line) => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('--');
      });
    
    let completedTables = 0;
    let rowsRestored = 0;
    let currentTable = '';
    
    // Execute in a transaction
    await conn.client.begin(async (tx) => {
      for (const statement of statements) {
        const trimmed = statement.trim();
        
        if (!trimmed || trimmed === 'BEGIN;' || trimmed === 'COMMIT;') {
          continue;
        }
        
        // Track current table
        if (trimmed.startsWith('DELETE FROM')) {
          const match = trimmed.match(/DELETE FROM "([^"]+)"/);
          if (match) {
            currentTable = match[1];
            completedTables++;
            
            onProgress?.({
              currentTable,
              completedTables,
              totalTables: metadata.tables.length,
              rowsRestored,
            });
          }
        }
        
        // Track rows restored
        if (trimmed.startsWith('INSERT INTO')) {
          rowsRestored++;
        }
        
        // Execute statement
        await tx.unsafe(trimmed);
      }
    });
    
    // Update metadata
    metadata.status = 'restored';
    metadata.restoredAt = new Date();
    await saveBackupMetadata(metadata);
    
    onLog?.('info', `Restore completed: ${rowsRestored} rows restored`);
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    metadata.status = 'failed';
    metadata.error = `Restore failed: ${message}`;
    await saveBackupMetadata(metadata);
    
    onLog?.('error', `Restore failed: ${message}`);
    
    throw error;
    
  } finally {
    if (conn) {
      await conn.close();
    }
  }
}

/**
 * Delete a backup
 */
export async function deleteBackup(backupId: string): Promise<void> {
  const metadata = await getBackupMetadata(backupId);
  
  if (!metadata) {
    return;
  }
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Delete from storage
      await supabase.storage
        .from(BACKUP_CONFIG.storageBucket)
        .remove([metadata.backupPath]);
      
      // Delete metadata
      await supabase
        .from('sync_backups')
        .delete()
        .eq('id', backupId);
    }
  } catch (error) {
    logger.warn('Failed to delete backup', { error });
  }

  // Remove from memory
  backupStore.delete(backupId);
  backupContentStore.delete(metadata.backupPath);
}

/**
 * Clean up old backups
 */
export async function cleanupOldBackups(userId: string): Promise<number> {
  let deletedCount = 0;
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return 0;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - BACKUP_CONFIG.maxBackupAgeDays);
    
    // Get old backups
    const { data: oldBackups } = await supabase
      .from('sync_backups')
      .select('id, backup_path')
      .eq('user_id', userId)
      .lt('created_at', cutoffDate.toISOString());
    
    if (oldBackups && oldBackups.length > 0) {
      // Delete storage files
      const paths = oldBackups.map((b) => b.backup_path);
      await supabase.storage
        .from(BACKUP_CONFIG.storageBucket)
        .remove(paths);
      
      // Delete metadata
      const ids = oldBackups.map((b) => b.id);
      await supabase
        .from('sync_backups')
        .delete()
        .in('id', ids);
      
      deletedCount = oldBackups.length;
    }
  } catch (error) {
    logger.warn('Failed to cleanup old backups', { error });
  }

  return deletedCount;
}

/**
 * Get backup by sync job ID
 */
export async function getBackupBySyncJobId(syncJobId: string): Promise<BackupMetadata | null> {
  // Check memory first
  for (const metadata of backupStore.values()) {
    if (metadata.syncJobId === syncJobId) {
      return metadata;
    }
  }
  
  // Try Supabase
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('sync_backups')
        .select('*')
        .eq('sync_job_id', syncJobId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      return {
        id: data.id,
        syncJobId: data.sync_job_id,
        userId: data.user_id,
        targetConnectionId: data.target_connection_id,
        tables: data.tables,
        backupPath: data.backup_path,
        sizeBytes: data.size_bytes,
        rowCount: data.row_count,
        status: data.status,
        createdAt: new Date(data.created_at),
        restoredAt: data.restored_at ? new Date(data.restored_at) : undefined,
        error: data.error,
      };
    }
  } catch (error) {
    logger.warn('Failed to get backup from Supabase', { error });
  }

  return null;
}

/**
 * Mark backup as completed (for when sync succeeds)
 */
export async function markBackupCompleted(backupId: string): Promise<void> {
  const metadata = await getBackupMetadata(backupId);
  
  if (metadata) {
    metadata.status = 'completed';
    await saveBackupMetadata(metadata);
  }
}


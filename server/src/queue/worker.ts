/**
 * Sync Job Worker
 * 
 * Processes background sync jobs from the queue
 */

import { Job } from 'bullmq';
import { createSyncWorker, closeQueues } from './client.js';
import { createDrizzleClient, type DrizzleConnection } from '../services/drizzle-factory.js';
import { decrypt } from '../services/encryption.js';
import { logger, createJobLogger } from '../utils/logger.js';
import { updateSyncJob, addSyncLog } from '../services/supabase-client.js';
import type { SyncJobData, SyncProgress, SyncCheckpoint } from '../types/index.js';

// Track cancelled jobs
const cancelledJobs = new Set<string>();

/**
 * Mark a job as cancelled
 */
export function markJobCancelled(jobId: string): void {
  cancelledJobs.add(jobId);
}

/**
 * Check if a job is cancelled
 */
function isJobCancelled(jobId: string): boolean {
  return cancelledJobs.has(jobId);
}

/**
 * Process a sync job
 */
async function processSyncJob(job: Job<SyncJobData>): Promise<void> {
  const { jobId, userId, sourceConnectionId, targetConnectionId, direction, tablesConfig, checkpoint } = job.data;
  
  const jobLogger = createJobLogger(jobId, userId);
  jobLogger.info({ sourceConnectionId, targetConnectionId, direction }, 'Starting sync job');
  
  let sourceConn: DrizzleConnection | null = null;
  let targetConn: DrizzleConnection | null = null;
  
  try {
    // Get connection URLs - these should be passed in the job data
    const sourceUrl = job.data.sourceUrl;
    const targetUrl = job.data.targetUrl;
    
    if (!sourceUrl || !targetUrl) {
      throw new Error('Source and target URLs are required');
    }
    
    // Decrypt database URLs
    const decryptedSourceUrl = decrypt(sourceUrl);
    const decryptedTargetUrl = decrypt(targetUrl);
    
    jobLogger.info('Credentials decrypted, connecting to databases');
    
    // Create database connections
    sourceConn = createDrizzleClient(decryptedSourceUrl);
    targetConn = createDrizzleClient(decryptedTargetUrl);
    
    jobLogger.info('Connected to databases');
    
    // Initialize progress
    const enabledTables = tablesConfig?.filter(t => t.enabled) || [];
    const progress: SyncProgress = {
      totalTables: enabledTables.length,
      completedTables: 0,
      currentTable: null,
      totalRows: 0,
      processedRows: 0,
      insertedRows: 0,
      updatedRows: 0,
      skippedRows: 0,
      errors: 0,
    };
    
    await job.updateProgress(progress);
    // Also persist to database
    await updateSyncJob(jobId, userId, { progress });
    
    // Process each table
    const processedTables = checkpoint?.processedTables || [];
    
    for (let i = 0; i < enabledTables.length; i++) {
      const tableConfig = enabledTables[i];
      const tableName = tableConfig.tableName;
      
      // Skip already processed tables
      if (processedTables.includes(tableName)) {
        progress.completedTables++;
        continue;
      }
      
      // Check for cancellation
      if (isJobCancelled(jobId)) {
        jobLogger.warn('Job cancelled by user');
        const newCheckpoint: SyncCheckpoint = {
          lastTable: tableName,
          lastRowId: '',
          lastUpdatedAt: new Date().toISOString(),
          processedTables,
        };
        await job.updateData({ ...job.data, checkpoint: newCheckpoint });
        await updateSyncJob(jobId, userId, {
          status: 'failed',
          completed_at: new Date().toISOString(),
          checkpoint: newCheckpoint,
          progress,
        });
        await addSyncLog(jobId, 'warn', 'Sync job cancelled by user');
        return;
      }
      
      progress.currentTable = tableName;
      await job.updateProgress(progress);
      // Persist progress to database
      await updateSyncJob(jobId, userId, { progress });
      
      jobLogger.info({ tableName, index: i + 1, total: enabledTables.length }, 'Processing table');
      await addSyncLog(jobId, 'info', `Processing table: ${tableName}`);
      
      try {
        // Get row count for progress tracking
        const countResult = await sourceConn.client.unsafe(
          `SELECT COUNT(*) as count FROM "${tableName}"`
        );
        const tableRowCount = parseInt(countResult[0]?.count as string || '0', 10);
        
        jobLogger.info({ tableName, rowCount: tableRowCount }, 'Table row count');
        
        // Process rows in batches
        const batchSize = 1000;
        let offset = 0;
        let hasMore = true;
        let tableInserted = 0;
        let tableUpdated = 0;
        let tableSkipped = 0;
        
        while (hasMore) {
          // Check for cancellation
          if (isJobCancelled(jobId)) {
            jobLogger.warn('Job cancelled during batch processing');
            return;
          }
          
          // Fetch batch from source
          const rows = await sourceConn.client.unsafe(
            `SELECT * FROM "${tableName}" ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`
          );
          
          if (rows.length === 0) {
            hasMore = false;
            break;
          }
          
          // Process batch
          await targetConn.client.begin(async (tx) => {
            for (const row of rows) {
              const rowId = row.id as string;
              if (!rowId) {
                tableSkipped++;
                continue;
              }
              
              try {
                // Check if row exists in target
                const existing = await tx.unsafe(
                  `SELECT id FROM "${tableName}" WHERE id = $1`,
                  [rowId]
                );
                
                const columns = Object.keys(row);
                const values = Object.values(row);
                
                if (existing.length === 0) {
                  // Insert new row
                  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                  const columnList = columns.map(c => `"${c}"`).join(', ');
                  
                  await tx.unsafe(
                    `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders})`,
                    values
                  );
                  tableInserted++;
                } else {
                  // Update existing row
                  const updateColumns = columns.filter(c => c !== 'id');
                  const updateValues = updateColumns.map(c => row[c]);
                  const setClause = updateColumns.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
                  
                  await tx.unsafe(
                    `UPDATE "${tableName}" SET ${setClause} WHERE id = $${updateColumns.length + 1}`,
                    [...updateValues, rowId]
                  );
                  tableUpdated++;
                }
              } catch (rowError) {
                jobLogger.warn({ rowId, error: rowError }, 'Error processing row');
                tableSkipped++;
              }
            }
          });
          
          // Update progress
          offset += rows.length;
          progress.processedRows = offset;
          progress.insertedRows += tableInserted;
          progress.updatedRows += tableUpdated;
          progress.skippedRows += tableSkipped;
          
          await job.updateProgress(progress);
          // Persist progress to database every batch
          await updateSyncJob(jobId, userId, { progress });
          
          // Reset counters
          tableInserted = 0;
          tableUpdated = 0;
          tableSkipped = 0;
          
          if (rows.length < batchSize) {
            hasMore = false;
          }
        }
        
        processedTables.push(tableName);
        progress.completedTables++;
        
        await updateSyncJob(jobId, userId, { progress });
        await addSyncLog(jobId, 'info', `Completed table: ${tableName}`, {
          inserted: progress.insertedRows,
          updated: progress.updatedRows,
          skipped: progress.skippedRows,
        });
        
        jobLogger.info({
          tableName,
          inserted: progress.insertedRows,
          updated: progress.updatedRows,
          skipped: progress.skippedRows,
        }, 'Table completed');
        
      } catch (tableError) {
        jobLogger.error({ tableName, error: tableError }, 'Error processing table');
        progress.errors++;
        await addSyncLog(jobId, 'error', `Error processing table ${tableName}: ${tableError instanceof Error ? tableError.message : 'Unknown error'}`);
        await updateSyncJob(jobId, userId, { progress });
      }
    }
    
    // Job completed
    await updateSyncJob(jobId, userId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      progress,
    });
    await addSyncLog(jobId, 'info', 'Sync job completed', {
      tablesProcessed: progress.completedTables,
      rowsInserted: progress.insertedRows,
      rowsUpdated: progress.updatedRows,
      rowsSkipped: progress.skippedRows,
      errors: progress.errors,
    });
    
    jobLogger.info({
      tablesProcessed: progress.completedTables,
      rowsInserted: progress.insertedRows,
      rowsUpdated: progress.updatedRows,
      rowsSkipped: progress.skippedRows,
      errors: progress.errors,
    }, 'Sync job completed');
    
    // Clean up cancelled status
    cancelledJobs.delete(jobId);
    
  } catch (error) {
    jobLogger.error({ error }, 'Sync job failed');
    await updateSyncJob(jobId, userId, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      progress,
    });
    await addSyncLog(jobId, 'error', `Sync job failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  } finally {
    if (sourceConn) await sourceConn.close();
    if (targetConn) await targetConn.close();
  }
}

/**
 * Initialize and start the sync worker
 */
export function startSyncWorker(): void {
  createSyncWorker(processSyncJob);
  
  logger.info('Sync worker initialized and listening for jobs');
  
  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down worker...`);
    await closeQueues();
    process.exit(0);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export { processSyncJob };


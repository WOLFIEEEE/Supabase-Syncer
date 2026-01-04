import { Job } from 'bullmq';
import { createSyncWorker } from './client';
import { executeSync, updateSyncJobStatus, addSyncLog } from '@/lib/services/sync-engine';
import { decrypt } from '@/lib/services/encryption';
import { db } from '@/lib/db/client';
import { connections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { SyncJobData, SyncProgress } from '@/types';

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
  const { jobId, sourceConnectionId, targetConnectionId, direction, tablesConfig, checkpoint } = job.data;
  
  console.log(`[Sync Worker] Starting job ${jobId}`);
  
  try {
    // Update job status to running
    await updateSyncJobStatus(jobId, 'running');
    await addSyncLog(jobId, 'info', 'Job started by worker');
    
    // Get connection details
    const [sourceConnection, targetConnection] = await Promise.all([
      db.query.connections.findFirst({
        where: eq(connections.id, sourceConnectionId),
      }),
      db.query.connections.findFirst({
        where: eq(connections.id, targetConnectionId),
      }),
    ]);
    
    if (!sourceConnection || !targetConnection) {
      throw new Error('Source or target connection not found');
    }
    
    // Decrypt database URLs
    const sourceUrl = decrypt(sourceConnection.encryptedUrl);
    const targetUrl = decrypt(targetConnection.encryptedUrl);
    
    await addSyncLog(jobId, 'info', 'Credentials decrypted, connecting to databases');
    
    // Execute sync
    const result = await executeSync({
      jobId,
      sourceUrl,
      targetUrl,
      tables: tablesConfig,
      direction,
      checkpoint,
      batchSize: 1000,
      onProgress: async (progress: SyncProgress) => {
        // Update job progress
        await job.updateProgress(progress);
        await updateSyncJobStatus(jobId, 'running', progress);
      },
      onLog: async (level, message, metadata) => {
        await addSyncLog(jobId, level, message, metadata);
        console.log(`[Sync Worker] [${level.toUpperCase()}] ${message}`);
      },
      shouldCancel: () => isJobCancelled(jobId),
    });
    
    // Update final status
    if (result.success) {
      await updateSyncJobStatus(jobId, 'completed', undefined, result.checkpoint);
      await addSyncLog(jobId, 'info', 'Job completed successfully', {
        tablesProcessed: result.tablesProcessed,
        rowsInserted: result.rowsInserted,
        rowsUpdated: result.rowsUpdated,
      });
    } else if (result.checkpoint) {
      // Job was paused or cancelled
      await updateSyncJobStatus(jobId, 'paused', undefined, result.checkpoint);
      await addSyncLog(jobId, 'warn', 'Job paused', {
        checkpoint: result.checkpoint,
      });
    } else {
      await updateSyncJobStatus(jobId, 'failed');
      await addSyncLog(jobId, 'error', 'Job failed with errors', {
        errors: result.errors,
      });
    }
    
    // Clean up cancelled status
    cancelledJobs.delete(jobId);
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Sync Worker] Job ${jobId} failed:`, message);
    
    await updateSyncJobStatus(jobId, 'failed');
    await addSyncLog(jobId, 'error', `Job failed: ${message}`);
    
    throw error;
  }
}

/**
 * Initialize and start the sync worker
 */
export function startSyncWorker(): void {
  const worker = createSyncWorker(processSyncJob);
  
  worker.on('completed', (job) => {
    console.log(`[Sync Worker] Job ${job.id} completed`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`[Sync Worker] Job ${job?.id} failed:`, err.message);
  });
  
  worker.on('error', (err) => {
    console.error('[Sync Worker] Worker error:', err.message);
  });
  
  console.log('[Sync Worker] Worker started and listening for jobs');
}

// Export for programmatic use
export { processSyncJob };

